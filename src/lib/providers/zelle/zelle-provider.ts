import { BasePaymentProvider } from '../base';
import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  PayoutInput,
  PayoutResult,
  GetPayoutInput,
  PaymentProviderCapabilities,
  PaymentStatus,
  ProviderConfigSchema,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../../config';

/**
 * Zelle payment provider (US bank transfers via Early Warning).
 *
 * IMPORTANT: Zelle has no public merchant API. It operates through
 * participating US banks and licensed aggregators (e.g. Fiserv,
 * FIS, Jack Henry, ACI). This adapter therefore targets a
 * configurable partner endpoint — the merchant's bank or aggregator
 * exposes Zelle send/receive rails, ZeePay calls them through here.
 * Paste the issued baseUrl + credentials in the dashboard and this
 * goes live with no code changes.
 *
 * Modelled behaviour:
 *  - Collections: request-to-pay — POST {base}/requests sends the
 *    customer a Zelle "request money" notice; they approve in their
 *    banking app. Zelle is push-only: there is no merchant-initiated
 *    debit, so recurring/mandates are NOT supported.
 *  - Payouts: POST {base}/payments — send money to a customer's
 *    Zelle alias (phone/email). This is Zelle's natural direction.
 *  - Refunds: executed as an outbound send to the original payer
 *    (Zelle transfers are final and cannot be reversed in place).
 *
 * Credentials expected in ProviderConfig.credentials:
 *   baseUrl       Partner/bank API endpoint (required to go live)
 *   clientId      Issued client identifier
 *   clientSecret  Issued client secret (required to go live)
 *   merchantId    Partner-issued merchant/payee ID
 *   payeeAlias    Merchant's own Zelle alias for request-to-pay
 */
export class ZelleProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private clientId!: string;
  private clientSecret!: string;
  private merchantId!: string;
  private payeeAlias!: string;

  readonly configSchema: ProviderConfigSchema = {
    baseUrl: { label: 'Partner API base URL', required: true, help: 'Issued by your bank or Zelle aggregator (Fiserv, FIS, ACI, ...)' },
    clientId: { label: 'Client ID', required: true },
    clientSecret: { label: 'Client secret', required: true, secret: true },
    merchantId: { label: 'Merchant/payee ID', required: false },
    payeeAlias: { label: 'Merchant Zelle alias', required: false, placeholder: 'phone or email registered for Zelle' },
  };

  constructor() {
    super('zelle', 'bank_transfer');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Zelle is push-only — no standing authorisations exist.
      supportsRecurring: false,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('Zelle provider requires configuration');
    }

    const c = this.config.credentials;
    this.baseUrl = (c.baseUrl || '') as string;
    this.clientId = (c.clientId || '') as string;
    this.clientSecret = (c.clientSecret || '') as string;
    this.merchantId = (c.merchantId || '') as string;
    this.payeeAlias = (c.payeeAlias || '') as string;
  }

  // ------------------------------------------------------------------
  // Collections — request-to-pay (customer pushes funds)
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['baseUrl', 'clientId', 'clientSecret'])) {
      return this.simulatedPayment(input);
    }

    const requestId = `zrq_${uuidv4()}`;
    const body = {
      requestId,
      merchantId: this.merchantId,
      payeeAlias: this.payeeAlias,
      payerAlias: input.customerPhone || input.customerEmail,
      amount: input.amount,
      currency: input.currency || 'USD',
      memo: (input.metadata?.description as string) || `Payment ${input.reference}`,
      reference: input.reference,
      notifyUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/zelle`,
    };

    try {
      const response = await this.makeRequest('/requests', 'POST', body);

      return {
        id: uuidv4(),
        providerReference: response.requestId || requestId,
        status: this.mapStatus(response.status) === 'succeeded' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Zelle request-to-pay failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['baseUrl', 'clientId', 'clientSecret'])) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.makeRequest(`/requests/${input.providerReference}`, 'GET');

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapStatus(response.status),
        amount: response.amount ? Number(response.amount) : 0,
        currency: response.currency || 'USD',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Zelle payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Zelle transfers are irrevocable — a "refund" is a fresh outbound
   * send back to the original payer's alias.
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['baseUrl', 'clientId', 'clientSecret'])) {
      return this.simulatedRefund(input);
    }

    try {
      const response = await this.makeRequest('/payments', 'POST', {
        paymentId: `zrf_${uuidv4()}`,
        merchantId: this.merchantId,
        senderAlias: this.payeeAlias,
        recipientAlias: input.metadata?.payerAlias,
        amount: input.amount,
        currency: input.currency,
        memo: input.reason || `Refund for ${input.paymentReference}`,
        reference: `REF-${input.paymentReference}`,
      });

      return {
        id: uuidv4(),
        providerReference: response.paymentId || `zrf_${uuidv4()}`,
        status: response.status === 'COMPLETED' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Zelle refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Payouts — send money to a Zelle alias
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || uuidv4();
    if (this.shouldSimulate(['baseUrl', 'clientId', 'clientSecret'])) {
      return this.simulatedPayout(input, externalReference);
    }

    try {
      const response = await this.makeRequest('/payments', 'POST', {
        paymentId: externalReference,
        merchantId: this.merchantId,
        senderAlias: this.payeeAlias,
        recipientAlias: input.recipientMsisdn,
        amount: input.amount,
        currency: input.currency || 'USD',
        memo: input.transferReference || 'ZeePay payout',
        notifyUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/zelle`,
      });

      return {
        id: uuidv4(),
        providerReference: response.paymentId || externalReference,
        externalReference,
        status: response.status === 'COMPLETED' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Zelle payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['baseUrl', 'clientId', 'clientSecret'])) {
      return this.simulatedGetPayout(input);
    }

    try {
      const response = await this.makeRequest(`/payments/${input.externalTransactionId}`, 'GET');

      return {
        id: uuidv4(),
        providerReference: input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: response.status === 'COMPLETED' ? 'succeeded' : response.status === 'FAILED' ? 'failed' : 'processing',
        amount: response.amount ? Number(response.amount) : 0,
        currency: input.currency,
        recipientMsisdn: input.msisdn,
        serviceType: 'merchant_to_subscriber',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Zelle payout lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const key = secret || this.clientSecret;
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
        eventType: data.eventType || 'payment.updated',
        providerReference: data.requestId || data.paymentId || data.reference,
        data,
      };
    } catch {
      throw new Error('Invalid Zelle webhook payload');
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

  private mapStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      SENT: 'processing',
      PENDING: 'processing',
      ACCEPTED: 'succeeded',
      COMPLETED: 'succeeded',
      PAID: 'succeeded',
      DECLINED: 'failed',
      FAILED: 'failed',
      EXPIRED: 'failed',
      CANCELLED: 'cancelled',
    };
    return map[(status || '').toUpperCase()] || 'pending';
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

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
      const message = data.message || data.error || text || response.statusText;
      throw new Error(`Zelle partner API error: ${response.status} - ${message}`);
    }

    return data;
  }
}
