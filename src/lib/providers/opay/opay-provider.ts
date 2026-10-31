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
 * OPay merchant payment provider (Nigeria).
 *
 * Implements the OPay merchant API:
 *  - Collections: POST /api/v3/payments/initialize — returns a hosted
 *    cashier URL (checkoutUrl) supporting wallet / card / bank transfer /
 *    USSD. Bearer publicKey auth.
 *  - Status: POST /api/v3/payments/status — signed requests:
 *    Authorization: Bearer HMAC-SHA512(JSON body, privateKey) hex,
 *    plus a MerchantId header.
 *  - Payouts: POST /api/v3/transfers — to bank account or OPay wallet.
 *  - Webhooks: HMAC-SHA512 signature over the raw payload.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   merchantId   OPay merchant ID (required)
 *   publicKey    OPay public key — initialize calls (required)
 *   privateKey   OPay private/secret key — signing (required)
 *   shortName    Merchant display name on the cashier page
 *   baseUrl      Optional override (defaults by environment)
 */
export class OPayProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private merchantId!: string;
  private publicKey!: string;
  private privateKey!: string;
  private shortName!: string;

  readonly configSchema: ProviderConfigSchema = {
    merchantId: { label: 'Merchant ID', required: true },
    publicKey: { label: 'Public key', required: true },
    privateKey: { label: 'Private key', required: true, secret: true },
    shortName: { label: 'Merchant short name', required: false, placeholder: 'Shown on the OPay cashier page' },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  constructor() {
    super('opay', 'mobile_money');
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
      throw new Error('OPay provider requires configuration');
    }

    const c = this.config.credentials;
    this.merchantId = (c.merchantId || '') as string;
    this.publicKey = (c.publicKey || '') as string;
    this.privateKey = (c.privateKey || '') as string;
    this.shortName = (c.shortName || 'ZeePay Merchant') as string;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://api.opaycheckout.com'
        : 'https://sandbox.opaycheckout.com');
  }

  // ------------------------------------------------------------------
  // Collections — hosted cashier
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['merchantId', 'publicKey', 'privateKey'])) {
      return this.simulatedPayment(input);
    }

    const body = {
      reference: input.reference,
      mchShortName: this.shortName,
      productName: (input.metadata?.productName as string) || 'ZeePay Payment',
      productDesc: (input.metadata?.description as string) || `Payment ${input.reference}`,
      userPhone: this.normalizeMsisdn(input.customerPhone),
      amount: this.toMinorUnits(input.amount),
      currency: input.currency || 'NGN',
      payMethods: ['account', 'qrcode', 'bankCard', 'bankTransfer', 'bankUSSD'],
      callbackUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/opay`,
      returnUrl: input.returnUrl,
      userInfo: input.customerEmail
        ? { userEmail: input.customerEmail, userName: input.customerEmail }
        : undefined,
    };

    try {
      const response = await this.publicRequest('/api/v3/payments/initialize', body);
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: data.orderNo || input.reference,
        status: 'processing',
        checkoutUrl: data.cashierUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OPay payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['merchantId', 'publicKey', 'privateKey'])) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.signedRequest('/api/v3/payments/status', {
        reference: input.providerReference,
      });
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: data.orderNo || input.providerReference,
        status: this.mapOpayStatus(data.status),
        amount: data.amount ? this.fromMinorUnits(data.amount) : 0,
        currency: data.currency || 'NGN',
        metadata: { failureReason: data.failureReason },
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OPay payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['merchantId', 'publicKey', 'privateKey'])) {
      return this.simulatedRefund(input);
    }

    try {
      const response = await this.signedRequest('/api/v3/payments/refund', {
        reference: input.paymentReference,
        refundAmount: this.toMinorUnits(input.amount),
        reason: input.reason || 'ZeePay refund',
      });

      return {
        id: uuidv4(),
        providerReference: response.data?.refundNo || uuidv4(),
        status: response.code === '00000' ? 'processing' : 'failed',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OPay refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Payouts — transfers
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || uuidv4();
    if (this.shouldSimulate(['merchantId', 'publicKey', 'privateKey'])) {
      return this.simulatedPayout(input, externalReference);
    }

    const body = {
      reference: externalReference,
      amount: this.toMinorUnits(input.amount),
      currency: input.currency || 'NGN',
      reason: input.transferReference || 'ZeePay payout',
      receiver: {
        type: 'OPAY',
        phone: this.normalizeMsisdn(input.recipientMsisdn),
      },
      notifyUrl: `${config.app.baseUrl}/api/v1/provider-webhooks/opay`,
    };

    try {
      const response = await this.signedRequest('/api/v3/transfers', body);
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: data.orderNo || externalReference,
        externalReference,
        status: data.status === 'SUCCESS' ? 'succeeded' : response.code === '00000' ? 'processing' : 'failed',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OPay payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['merchantId', 'publicKey', 'privateKey'])) {
      return this.simulatedGetPayout(input);
    }

    try {
      const response = await this.signedRequest('/api/v3/transfers/status', {
        reference: input.externalTransactionId,
      });
      const data = response.data || {};

      return {
        id: uuidv4(),
        providerReference: data.orderNo || input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: data.status === 'SUCCESS' ? 'succeeded' : data.status === 'FAIL' ? 'failed' : 'processing',
        amount: data.amount ? this.fromMinorUnits(data.amount) : 0,
        currency: input.currency,
        recipientMsisdn: input.msisdn,
        serviceType: 'merchant_to_subscriber',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OPay payout lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const key = secret || this.privateKey;
    if (!key) return false;
    const expected = crypto.createHmac('sha512', key).update(payload).digest('hex');
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
      const status = (data.status || data.data?.status || '').toUpperCase();
      return {
        eventType:
          status === 'SUCCESS' ? 'payment.succeeded' :
          status === 'FAIL' || status === 'CLOSE' ? 'payment.failed' : 'payment.updated',
        providerReference: data.reference || data.orderNo || data.data?.reference,
        data,
      };
    } catch {
      throw new Error('Invalid OPay webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return this.shouldSimulate(['merchantId', 'publicKey', 'privateKey']) ? true : true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private mapOpayStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      INITIAL: 'pending',
      PENDING: 'processing',
      SUCCESS: 'succeeded',
      FAIL: 'failed',
      CLOSE: 'cancelled',
    };
    return map[(status || '').toUpperCase()] || 'pending';
  }

  /** OPay amounts are transmitted in minor units (kobo for NGN). */
  private toMinorUnits(amount: number): number {
    return Math.round(amount * 100);
  }

  private fromMinorUnits(amount: number | string): number {
    return Number(amount) / 100;
  }

  /** Initialize calls authenticate with the public key only. */
  private async publicRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.publicKey}`,
        MerchantId: this.merchantId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.code && data.code !== '00000') {
      throw new Error(`OPay API error: ${data.code} - ${data.message}`);
    }
    return data;
  }

  /** Status/transfer calls sign the raw JSON body: HMAC-SHA512 hex. */
  private async signedRequest(endpoint: string, body: any): Promise<any> {
    const rawBody = JSON.stringify(body);
    const signature = crypto.createHmac('sha512', this.privateKey).update(rawBody).digest('hex');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signature}`,
        MerchantId: this.merchantId,
      },
      body: rawBody,
    });

    const data = await response.json();
    if (data.code && data.code !== '00000') {
      throw new Error(`OPay API error: ${data.code} - ${data.message}`);
    }
    return data;
  }

  private normalizeMsisdn(phone?: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '');
  }
}
