import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/client';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import {
  scanSignup,
  recordSignupSignals,
  recordFlag,
  hasApprovedMultiAccount,
  hashFingerprint,
} from '@/lib/services/fraud-service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  businessName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  nationalId: z.string().max(50).optional(),
  /** Client-composed fingerprint material — hashed server-side. */
  deviceFingerprint: z.string().max(200).optional(),
});

function requestIp(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * POST /api/v1/auth/register
 * Merchant signup with the one-person-one-account fraud gate.
 *
 * The scan runs BEFORE any account is created. A 'review' verdict
 * returns 403 with the detected signals so the client can offer the
 * manual-review request path — an approved multi_account_request
 * lets the same applicant through exactly once.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validationResult = registerSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.issues },
      { status: 400 }
    );
  }
  const input = validationResult.data;

  const ip = requestIp(request);
  const deviceFingerprint = input.deviceFingerprint
    ? hashFingerprint(input.deviceFingerprint)
    : undefined;

  // Fraud gate — deterministic signals + advisory AI score
  const scan = await scanSignup({
    email: input.email,
    phone: input.phone,
    businessName: input.businessName,
    ip,
    deviceFingerprint,
    nationalId: input.nationalId,
  });

  if (scan.verdict === 'review') {
    const approved = await hasApprovedMultiAccount(input.email);
    if (!approved) {
      await recordFlag(input.email, scan);
      return NextResponse.json(
        {
          error: 'Registration requires review',
          message:
            'Our fraud checks flagged this signup as a possible duplicate account. ' +
            'If you have a legitimate reason for a second account, submit a review request.',
          reviewRequired: true,
          riskSignals: scan.signals.map((s) => s.type),
        },
        { status: 403 }
      );
    }
    // Approved — one second account allowed; the flag stays recorded.
  }

  try {
    const merchantId = uuidv4();
    const { error: merchantError } = await supabaseAdmin.from('merchants').insert({
      id: merchantId,
      business_name: input.businessName,
      business_email: input.email,
      business_phone: input.phone,
      status: 'pending',
    });
    if (merchantError) {
      throw new Error(`Failed to create merchant: ${merchantError.message}`);
    }

    const userId = uuidv4();
    const { error: userError } = await supabaseAdmin.from('merchant_users').insert({
      id: userId,
      merchant_id: merchantId,
      email: input.email,
      password_hash: await hashPassword(input.password),
      role: 'admin',
    });
    if (userError) {
      await supabaseAdmin.from('merchants').delete().eq('id', merchantId);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Persist observable signals for future duplicate detection
    await recordSignupSignals(merchantId, {
      email: input.email,
      phone: input.phone,
      businessName: input.businessName,
      ip,
      deviceFingerprint,
      nationalId: input.nationalId,
    });
    if (scan.signals.length > 0) {
      await recordFlag(merchantId, scan);
    }

    const token = generateToken({
      userId,
      merchantId,
      email: input.email,
      role: 'admin',
    });

    return NextResponse.json(
      {
        user: { id: userId, email: input.email, name: input.name, role: 'admin' },
        merchant: { id: merchantId, businessName: input.businessName, status: 'pending' },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
