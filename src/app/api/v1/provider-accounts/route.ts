import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/database/client';
import { providerRegistry } from '@/lib/providers/registry';
import { initializeProviderForMerchant } from '@/lib/services/provider-credentials';
import { encrypt, decrypt } from '@/lib/utils/crypto';
import { z } from 'zod';

const upsertSchema = z.object({
  provider: z.string().min(1),
  environment: z.enum(['test', 'live']),
  credentials: z.record(z.string(), z.any()),
  isActive: z.boolean().optional(),
});

const deactivateSchema = z.object({
  provider: z.string().min(1),
  environment: z.enum(['test', 'live']),
});

const testSchema = z.object({
  action: z.literal('test'),
  provider: z.string().min(1),
  environment: z.enum(['test', 'live']),
});

/**
 * Provider accounts — the plug-and-play credential surface.
 *
 * GET    /api/v1/provider-accounts           list providers + config status
 * PUT    /api/v1/provider-accounts           save/rotate credentials (encrypted)
 * POST   /api/v1/provider-accounts           { action: 'test' } — health check
 * DELETE /api/v1/provider-accounts           deactivate an environment
 *
 * Credentials are AES-256-GCM encrypted into merchant_provider_accounts.
 * A provider with no saved credentials runs in simulation mode; saving
 * credentials switches the same code paths to the real gateway — no
 * code changes required.
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  try {
    // Merchant's saved accounts, joined to provider rows for the schema
    const { data: accounts } = await supabaseAdmin
      .from('merchant_provider_accounts')
      .select('provider_id, environment, is_active, updated_at, credentials_encrypted, payment_providers(name)')
      .eq('merchant_id', merchantId);

    const byProviderEnv = new Map<string, any>();
    for (const a of accounts || []) {
      byProviderEnv.set(`${(a.payment_providers as any)?.name}:${a.environment}`, a);
    }

    const providers = providerRegistry.getAll().map((provider) => {
      const schema = provider.configSchema || {};
      const required = Object.entries(schema)
        .filter(([, f]) => f.required)
        .map(([k]) => k);

      const environments: Record<string, any> = {};
      for (const env of ['test', 'live'] as const) {
        const row = byProviderEnv.get(`${provider.name}:${env}`);
        let missingRequired = required;
        if (row?.credentials_encrypted) {
          const creds = decrypt(row.credentials_encrypted) || {};
          missingRequired = required.filter(
            (k) => !creds[k] || String(creds[k]).trim() === ''
          );
        }
        environments[env] = {
          configured: Boolean(row) && missingRequired.length === 0,
          partiallyConfigured: Boolean(row) && missingRequired.length > 0,
          missingRequired,
          isActive: row?.is_active ?? false,
          updatedAt: row?.updated_at ?? null,
          simulated: !row || missingRequired.length > 0,
        };
      }

      return {
        name: provider.name,
        type: provider.type,
        capabilities: provider.getCapabilities(),
        configSchema: schema,
        environments,
      };
    });

    return NextResponse.json({ data: providers });
  } catch (error) {
    console.error('Error listing provider accounts:', error);
    return NextResponse.json(
      { error: 'Failed to list providers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  const body = await request.json();
  const validation = upsertSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { provider: providerName, environment, credentials, isActive } = validation.data;
  const provider = providerRegistry.get(providerName);
  if (!provider) {
    return NextResponse.json({ error: `Unknown provider '${providerName}'` }, { status: 404 });
  }

  try {
    // Resolve (or lazily create) the provider row — keeps this working
    // even before schema seeds have run.
    let providerId: string;
    const { data: existing } = await supabaseAdmin
      .from('payment_providers')
      .select('id')
      .eq('name', provider.name)
      .maybeSingle();

    if (existing) {
      providerId = existing.id;
    } else {
      const { data: created, error: createError } = await supabaseAdmin
        .from('payment_providers')
        .insert({
          name: provider.name,
          provider_type: provider.type,
          supports_test: true,
          supports_live: true,
          capabilities: provider.getCapabilities(),
          config_schema: provider.configSchema || {},
        })
        .select('id')
        .single();
      if (createError || !created) {
        throw new Error(`Failed to register provider: ${createError?.message}`);
      }
      providerId = created.id;
    }

    // Merge onto existing credentials so partial form submissions
    // (e.g. rotating just a secret) don't wipe sibling fields.
    const { data: existingAccount } = await supabaseAdmin
      .from('merchant_provider_accounts')
      .select('id, credentials_encrypted')
      .eq('merchant_id', merchantId)
      .eq('provider_id', providerId)
      .eq('environment', environment)
      .maybeSingle();

    const previous = existingAccount?.credentials_encrypted
      ? decrypt(existingAccount.credentials_encrypted) || {}
      : {};

    const merged: Record<string, any> = { ...previous };
    for (const [k, v] of Object.entries(credentials)) {
      // Empty strings mean "leave unchanged" for secret fields the
      // dashboard leaves blank; explicit null clears a field.
      if (v === '' || v === undefined) continue;
      merged[k] = v;
    }

    const payload = {
      merchant_id: merchantId,
      provider_id: providerId,
      environment,
      credentials_encrypted: encrypt(merged),
      is_active: isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = existingAccount
      ? await supabaseAdmin
          .from('merchant_provider_accounts')
          .update(payload)
          .eq('id', existingAccount.id)
      : await supabaseAdmin
          .from('merchant_provider_accounts')
          .insert(payload);

    if (upsertError) {
      throw new Error(`Failed to save credentials: ${upsertError.message}`);
    }

    const required = Object.entries(provider.configSchema || {})
      .filter(([, f]) => f.required)
      .map(([k]) => k);
    const missingRequired = required.filter(
      (k) => !merged[k] || String(merged[k]).trim() === ''
    );

    return NextResponse.json({
      provider: provider.name,
      environment,
      configured: missingRequired.length === 0,
      missingRequired,
      isActive: payload.is_active,
    });
  } catch (error) {
    console.error('Error saving provider credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  const body = await request.json();
  const validation = testSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { provider: providerName, environment } = validation.data;
  const provider = providerRegistry.get(providerName);
  if (!provider) {
    return NextResponse.json({ error: `Unknown provider '${providerName}'` }, { status: 404 });
  }

  try {
    await initializeProviderForMerchant(provider, merchantId, environment);
    const healthy = await provider.healthCheck();

    // Report whether the call was real or simulated so the dashboard
    // can show "simulation mode" vs "connected".
    const { data: providerRow } = await supabaseAdmin
      .from('payment_providers')
      .select('id')
      .eq('name', provider.name)
      .maybeSingle();

    const { data: account } = providerRow
      ? await supabaseAdmin
          .from('merchant_provider_accounts')
          .select('credentials_encrypted, is_active')
          .eq('merchant_id', merchantId)
          .eq('provider_id', providerRow.id)
          .eq('environment', environment)
          .eq('is_active', true)
          .maybeSingle()
      : { data: null };

    return NextResponse.json({
      provider: provider.name,
      environment,
      healthy,
      configured: Boolean(account?.credentials_encrypted),
      simulated: !account?.credentials_encrypted,
    });
  } catch (error) {
    return NextResponse.json({
      provider: provider.name,
      environment,
      healthy: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { merchantId } = authResult;

  const body = await request.json();
  const validation = deactivateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { provider: providerName, environment } = validation.data;

  try {
    const { data: providerRow } = await supabaseAdmin
      .from('payment_providers')
      .select('id')
      .eq('name', providerName.toLowerCase())
      .maybeSingle();

    if (!providerRow) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('merchant_provider_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('merchant_id', merchantId)
      .eq('provider_id', providerRow.id)
      .eq('environment', environment);

    if (updateError) {
      throw new Error(`Failed to deactivate: ${updateError.message}`);
    }

    return NextResponse.json({ provider: providerName, environment, isActive: false });
  } catch (error) {
    console.error('Error deactivating provider account:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
