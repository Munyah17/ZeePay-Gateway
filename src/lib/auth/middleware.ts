import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './api-keys';
import { verifyToken, extractTokenFromHeader } from './jwt';

export interface AuthContext {
  merchantId: string;
  environment: 'test' | 'live';
  userId?: string;
}

/**
 * Middleware to authenticate API requests using API key
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key' },
      { status: 401 }
    );
  }

  const authData = await validateApiKey(apiKey);

  if (!authData) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  return {
    merchantId: authData.merchantId,
    environment: authData.environment,
  };
}

/**
 * Middleware to authenticate dashboard requests using JWT
 */
export async function authenticateDashboard(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authorization token' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return {
    merchantId: payload.merchantId,
    userId: payload.userId,
    environment: 'live', // Dashboard always uses live context
  };
}

/**
 * Helper to check if result is an error response
 */
export function isErrorResponse(
  result: AuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
