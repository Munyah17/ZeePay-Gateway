import { BasePaymentProvider } from '../base';
import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  PaymentProviderCapabilities,
  PaymentStatus,
  ProviderConfigSchema,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../../config';

/**
 * Cash App Pay provider (US — Block/Square ecosystem).
 *
 * Implements the Cash App Pay network API shape for approved merchant
 * partners:
 *  - Collections: POST /requests — creates a payment request the
 *    customer approves in the Cash App via a deep link / QR code
 *    (auth_flow_triggers). Result is a checkoutUrl for the shopper.
 *  - Status: GET /requests/{requestId}.
 *  - Refunds: POST /requests/{requestId}/refund (returns funds to the
 *    customer's Cash App balance or linked card).
 *  - Auth: HTTP Basic (clientId:apiKey) on every call.
 *  - Webhooks: events signed per the partner integration contract.
 *
 * Note: Cash App Pay approval is gated — merchants are onboarded
 * through Block's partner programme (or via Stripe/Checkout.com
 * which wrap the same rail). Endpoints and auth are credential-driven
 * so aggregator-issued keys work without code changes.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   clientId   Issued client ID (required)
 *   apiKey     Issued API/secret key (required)
 *   scopeId    Brand/scope ID for payment requests
 *   baseUrl    Optional override (defaults by environment)
 */
export class CashAppProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private clientId!: string;
  private apiKey!: string;
  private scopeId!: string;

  readonly configSchema: ProviderConfigSchema = {
    clientId: { label: 'Client ID', required: true },
    apiKey: { label: 'API key', required: true, secret: true },
    scopeId: { label: 'Scope/brand ID', required: false, help: 'Issued during Cash App Pay onboarding' },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  constructor() {
    super('cashapp', 'wallet');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      supportsRecurring: false,
      createPayout: false,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('Cash App Pay provider requires configuration');
    }

    const c = this.config.credentials;
    this.clientId = (c.clientId || '') as string;
    this.apiKey = (c.apiKey || '') as string;
    this.scopeId = (c.scopeId || '') as string;

    this.baseUrl =
      (c.baseUrl as string) ||
      'https://api.cash.app';
  }

  // ------------------------------------------------------------------
  // Collections — payment request (customer approves in-app)
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'apiKey'])) {
      return this.simulatedPayment(input);
    }

    const body = {
      request: {
        action: {
          amount: Math.round(input.amount * 100), // minor units (cents)
          currency: input.currency || 'USD',
          scope_id: this.scopeId || undefined,
          type: 'ONE_TIME_PAYMENT',
        },
        channel: 'IN_APP',
        reference_id: input.reference,
        redirect_urls: input.returnUrl
          ? { success: input.returnUrl, failure: input.cancelUrl || input.returnUrl }
          : undefined,
        metadata: input.metadata,
      },
      idempotency_key: uuidv4(),
    };

    try {
      const response = await this.makeRequest('/requests', 'POST', body);
      const request = response.request || response;
      const trigger = request.auth_flow_triggers || {};

      return {
        id: uuidv4(),
        providerReference: request.id || request.request_id,
        status: this.mapRequestStatus(request.status),
        checkoutUrl: trigger.mobile_url || trigger.qr_code_image_url,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Cash App Pay request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'apiKey'])) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.makeRequest(`/requests/${input.providerReference}`, 'GET');
      const request = response.request || response;
      const amount = request.action?.amount ? Number(request.action.amount) / 100 : 0;

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapRequestStatus(request.status),
        amount,
        currency: request.action?.currency || 'USD',
        metadata: request.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Cash App Pay status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'apiKey'])) {
      return this.simulatedRefund(input);
    }

    try {
      const response = await this.makeRequest(`/requests/${input.paymentReference}/refund`, 'POST', {
        refund: {
          amount: Math.round(input.amount * 100),
          currency: input.currency || 'USD',
        },
        idempotency_key: uuidv4(),
      });

      return {
        id: uuidv4(),
        providerReference: response.refund?.id || `crf_${uuidv4()}`,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Cash App Pay refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const key = secret || this.apiKey;
    if (!key) return false;
    const expected = crypto.createHmac('sha256', key).update(payload).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  parseWebhook(payload: string): {
    eventType: string;
    providerReference: string;
    data: Record<string, any>;
  } {
    try {
      const data = JSON.parse(payload);
      return {
        eventType: data.event_type || data.eventType || 'payment.updated',
        providerReference:
          data.data?.request?.id || data.request?.id || data.request_id,
        data,
      };
    } catch {
      throw new Error('Invalid Cash App Pay webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private mapRequestStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PENDING: 'processing',
      APPROVED: 'processing',
      CAPTURED: 'succeeded',
      SUCCEEDED: 'succeeded',
      COMPLETED: 'succeeded',
      DECLINED: 'failed',
      FAILED: 'failed',
      REFUNDED: 'cancelled',
      EXPIRED: 'cancelled',
      CANCELLED: 'cancelled',
    };
    return map[(status || '').toUpperCase()] || 'pending';
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const basic = Buffer.from(`${this.clientId}:${this.apiKey}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basic}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = data.error?.message || data.message || data.error || text || response.statusText;
      throw new Error(`Cash App Pay API error: ${response.status} - ${message}`);
    }

    return data;
  }
}
