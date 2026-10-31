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
 * PalmPay merchant payment provider (Nigeria).
 *
 * Implements the PalmPay merchant API shape:
 *  - Collections: POST /api/v2/payment/merchant/createOrder — returns a
 *    hosted cashier/pay URL the customer completes on PalmPay.
 *  - Status: POST /api/v2/payment/merchant/queryOrder.
 *  - Refunds: POST /api/v2/payment/merchant/refund.
 *  - Payouts: POST /api/v2/payment/merchant/transfer (merchant → wallet).
 *
 * Auth: every request carries `appId` in the query string and an `sign`
 * field — MD5 of the sorted key=value parameter string plus the
 * merchant secret key. PalmPay docs are partially gated; the base URL
 * and all endpoints are overridable via credentials so the adapter can
 * be tuned without code changes once portal access is granted.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   appId        PalmPay merchant app ID (required)
 *   merchantId   Merchant account ID (required)
 *   secretKey    Merchant secret key for signing (required)
 *   baseUrl      Optional override (defaults by environment)
 */
export class PalmPayProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private appId!: string;
  private merchantId!: string;
  private secretKey!: string;

  readonly configSchema: ProviderConfigSchema = {
    appId: { label: 'App ID', required: true },
    merchantId: { label: 'Merchant ID', required: true },
    secretKey: { label: 'Secret key (signing)', required: true, secret: true },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  constructor() {
    super('palmpay', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      supportsRecurring: false,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('PalmPay provider requires configuration');
    }

    const c = this.config.credentials;
    this.appId = (c.appId || '') as string;
    this.merchantId = (c.merchantId || '') as string;
    this.secretKey = (c.secretKey || '') as string;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://open.palmpay.com'
        : 'https://sandbox.palmpay.com');
  }

  // ------------------------------------------------------------------
  // Collections — hosted order
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['appId', 'merchantId', 'secretKey'])) {
      return this.simulatedPayment(input);
    }

    const orderId = `zp_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const body = {
      merchantId: this.merchantId,
      orderId,
      title: (input.metadata?.description as string) || 'ZeePay Payment',
      description: `Payment ${input.reference}`,
      amount: Math.round(input.amount * 100), // minor units (kobo)
      currency: input.currency || 'NGN',
      orderType: 'PAY',
      notifyUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/palmpay`,
      callBackUrl: input.returnUrl,
      reference: input.reference,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
    };

    try {
      const response = await this.signedRequest('/api/v2/payment/merchant/createOrder', body);
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: orderId,
        status: 'processing',
        checkoutUrl: data.payUrl || data.cashierUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`PalmPay payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['appId', 'merchantId', 'secretKey'])) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.signedRequest('/api/v2/payment/merchant/queryOrder', {
        merchantId: this.merchantId,
        orderId: input.providerReference,
      });
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapOrderStatus(data.orderStatus ?? data.status),
        amount: data.amount ? Number(data.amount) / 100 : 0,
        currency: data.currency || 'NGN',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`PalmPay payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['appId', 'merchantId', 'secretKey'])) {
      return this.simulatedRefund(input);
    }

    try {
      const response = await this.signedRequest('/api/v2/payment/merchant/refund', {
        merchantId: this.merchantId,
        orderId: input.paymentReference,
        refundOrderId: `rfd_${Date.now()}`,
        amount: Math.round(input.amount * 100),
        reason: input.reason || 'ZeePay refund',
      });

      return {
        id: uuidv4(),
        providerReference: response.data?.refundOrderId || `rfd_${uuidv4()}`,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`PalmPay refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Payouts — merchant transfer to wallet
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || uuidv4();
    if (this.shouldSimulate(['appId', 'merchantId', 'secretKey'])) {
      return this.simulatedPayout(input, externalReference);
    }

    const body = {
      merchantId: this.merchantId,
      orderId: externalReference,
      amount: Math.round(input.amount * 100),
      currency: input.currency || 'NGN',
      payeeAccount: input.recipientMsisdn.replace(/[^\d]/g, ''),
      payeeAccountType: 'WALLET',
      remark: input.transferReference || 'ZeePay payout',
      notifyUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/palmpay`,
    };

    try {
      const response = await this.signedRequest('/api/v2/payment/merchant/transfer', body);
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: data.orderId || externalReference,
        externalReference,
        status: this.mapOrderStatus(data.orderStatus ?? data.status) === 'succeeded' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`PalmPay payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['appId', 'merchantId', 'secretKey'])) {
      return this.simulatedGetPayout(input);
    }

    try {
      const response = await this.signedRequest('/api/v2/payment/merchant/queryOrder', {
        merchantId: this.merchantId,
        orderId: input.externalTransactionId,
      });
      const data = response.data || {};
      const status = this.mapOrderStatus(data.orderStatus ?? data.status);

      return {
        id: uuidv4(),
        providerReference: input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: status === 'succeeded' ? 'succeeded' : status === 'failed' ? 'failed' : 'processing',
        amount: data.amount ? Number(data.amount) / 100 : 0,
        currency: input.currency,
        recipientMsisdn: input.msisdn,
        serviceType: 'merchant_to_subscriber',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`PalmPay payout lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const key = secret || this.secretKey;
    if (!key) return false;
    const expected = crypto.createHash('md5').update(`${payload}${key}`).digest('hex');
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
      const status = Number(data.orderStatus ?? data.status ?? -1);
      return {
        eventType:
          status === 2 ? 'payment.succeeded' :
          status === 3 || status === 4 ? 'payment.failed' : 'payment.updated',
        providerReference: data.orderId,
        data,
      };
    } catch {
      throw new Error('Invalid PalmPay webhook payload');
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

  /** PalmPay order statuses: 1 pending, 2 success, 3 failed, 4 closed. */
  private mapOrderStatus(status: number | string): PaymentStatus {
    const code = Number(status);
    if (code === 2) return 'succeeded';
    if (code === 3 || code === 4) return 'failed';
    if (code === 1) return 'processing';
    return 'pending';
  }

  /**
   * Sorted-parameter MD5 signing: concatenate non-empty params as
   * `k=v&` in key order, append `key=<secretKey>`, MD5 hex uppercase.
   */
  private sign(params: Record<string, any>): string {
    const signSource = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '' && k !== 'sign')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    return crypto
      .createHash('md5')
      .update(`${signSource}&key=${this.secretKey}`)
      .digest('hex')
      .toUpperCase();
  }

  private async signedRequest(endpoint: string, body: Record<string, any>): Promise<any> {
    const signedBody = { ...body, sign: this.sign(body) };

    const response = await fetch(`${this.baseUrl}${endpoint}?appId=${this.appId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signedBody),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok || (data.respCode && data.respCode !== '00000000')) {
      throw new Error(
        `PalmPay API error: ${data.respCode || response.status} - ${data.respMsg || text || response.statusText}`
      );
    }

    return data;
  }
}
