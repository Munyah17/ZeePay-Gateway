import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, isErrorResponse } from '@/lib/auth/middleware';
import { supabaseAdmin } from '@/lib/database/client';
import { providerRegistry } from '@/lib/providers/registry';

/**
 * GET /api/v1/payment-methods
 * List available payment methods
 */
export async function GET(request: NextRequest) {
  // Authenticate request
  const authResult = await authenticateApiKey(request);
  if (isErrorResponse(authResult)) {
    return authResult;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*, payment_providers(name, provider_type)')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    // If database has payment methods, return those
    if (data && data.length > 0) {
      const paymentMethods = data.map((method) => ({
        id: method.id,
        code: method.method_code,
        name: method.display_name,
        provider: method.payment_providers?.name,
        type: method.payment_providers?.provider_type,
        supportedCurrencies: method.supported_currencies,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
      }));

      return NextResponse.json({
        data: paymentMethods,
      });
    }

    // Fallback: Return available providers from registry
    const providers = providerRegistry.getAll();
    const paymentMethods = providers.map((provider) => ({
      id: provider.name,
      code: provider.name,
      name: provider.name.charAt(0).toUpperCase() + provider.name.slice(1),
      provider: provider.name,
      type: provider.type,
      supportedCurrencies: ['USD', 'ZWL'],
      minAmount: 0.01,
      maxAmount: 100000,
    }));

    return NextResponse.json({
      data: paymentMethods,
    });
  } catch (error) {
    console.error('Error listing payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to list payment methods', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
