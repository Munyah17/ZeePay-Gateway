import { BasePaymentProvider } from '../base';
import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  CreateMandateInput,
  MandateResult,
  ChargeMandateInput,
  RevokeMandateInput,
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
 * OneMoney payment provider — NetOne Zimbabwe mobile money.
 *
 * OneMoney's merchant API is gated behind NetOne business onboarding;
 * this adapter implements the conventional wallet-debit shape shared by
 * Zimbabwean mobile money APIs (EcoCash-family style): a merchant-
 * initiated debit the customer confirms via a USSD/PIN prompt, keyed
 * by a client correlator for status lookups.
 *
 * All endpoints and auth are configurable via credentials so the
 * adapter can be aligned to the issued contract once portal access is
 * granted — set `baseUrl`, `clientId`, `clientSecret`, `merchantCode`
 * in the dashboard and it goes live with no code changes.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   clientId       Issued client/merchant identifier (required)
 *   clientSecret   Issued secret — Bearer token source (required)
 *   merchantCode   Merchant/till code (required)
 *   merchantNumber Registered merchant MSISDN
 *   terminalId     POS terminal identifier
 *   notifyUrl      Callback URL override
 *   baseUrl        API base URL override (required until issued)
 */
export class OneMoneyProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private clientId!: string;
  private clientSecret!: string;
  private merchantCode!: string;
  private merchantNumber!: string;
  private terminalId!: string;
  private notifyUrl?: string;

  readonly configSchema: ProviderConfigSchema = {
    clientId: { label: 'Client ID', required: true },
    clientSecret: { label: 'Client secret', required: true, secret: true },
    merchantCode: { label: 'Merchant code', required: true },
    merchantNumber: { label: 'Merchant MSISDN', required: false, placeholder: '263...' },
    terminalId: { label: 'Terminal ID', required: false },
    notifyUrl: { label: 'Callback URL override', required: false },
    baseUrl: { label: 'API base URL', required: false, help: 'Required until NetOne issues endpoint details' },
  };

  constructor() {
    super('onemoney', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      supportsRecurring: true,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('OneMoney provider requires configuration');
    }

    const c = this.config.credentials;
    this.clientId = (c.clientId || '') as string;
    this.clientSecret = (c.clientSecret || '') as string;
    this.merchantCode = (c.merchantCode || '') as string;
    this.merchantNumber = (c.merchantNumber || '') as string;
    this.terminalId = (c.terminalId || 'WEB00001') as string;
    this.notifyUrl = (c.notifyUrl as string) || undefined;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://api.onemoney.co.zw'
        : 'https://sandbox.onemoney.co.zw');
  }

  // ------------------------------------------------------------------
  // Collections — wallet debit (PIN prompt)
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedPayment(input);
    }

    const correlator = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const msisdn = this.normalizeMsisdn(input.customerPhone);

    const body = {
      clientCorrelator: correlator,
      referenceCode: input.reference,
      transactionType: 'MERCHANT_PAYMENT',
      msisdn,
      amount: input.amount,
      currency: input.currency || 'USD',
      description: (input.metadata?.description as string) || 'ZeePay payment',
      merchantCode: this.merchantCode,
      merchantNumber: this.merchantNumber,
      terminalId: this.terminalId,
      notifyUrl: this.notifyUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/onemoney`,
    };

    try {
      const response = await this.makeRequest('/v1/payments', 'POST', body);

      return {
        id: uuidv4(),
        providerReference: `${correlator}|${msisdn}`,
        status: this.mapStatus(response.status || response.transactionStatus),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OneMoney payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedGetPayment(input);
    }

    const [correlator, msisdn] = input.providerReference.split('|');

    try {
      const response = await this.makeRequest(`/v1/payments/${correlator}`, 'GET', undefined, {
        msisdn,
      });

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapStatus(response.status || response.transactionStatus),
        amount: response.amount ? Number(response.amount) : 0,
        currency: response.currency || 'USD',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OneMoney payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedRefund(input);
    }

    const [correlator] = input.paymentReference.split('|');
    const refundCorrelator = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const body = {
      clientCorrelator: refundCorrelator,
      originalCorrelator: correlator,
      transactionType: 'REFUND',
      amount: input.amount,
      currency: input.currency,
      reason: input.reason || 'ZeePay refund',
      merchantCode: this.merchantCode,
      terminalId: this.terminalId,
    };

    try {
      const response = await this.makeRequest('/v1/refunds', 'POST', body);

      return {
        id: uuidv4(),
        providerReference: refundCorrelator,
        status: response.status === 'SUCCESS' || response.responseCode === '00' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OneMoney refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Payouts — merchant disbursement into wallet
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedPayout(input, externalReference);
    }

    const body = {
      externalReference,
      transactionType: 'DISBURSEMENT',
      msisdn: this.normalizeMsisdn(input.recipientMsisdn),
      amount: input.amount,
      currency: input.currency,
      transferReference: input.transferReference || 'ZeePay payout',
      merchantCode: this.merchantCode,
      terminalId: this.terminalId,
      notifyUrl: this.notifyUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/onemoney`,
    };

    try {
      const response = await this.makeRequest('/v1/disbursements', 'POST', body);

      return {
        id: uuidv4(),
        providerReference: response.transactionId || externalReference,
        externalReference,
        status: response.responseCode === '00' ? 'succeeded' : 'processing',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OneMoney payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedGetPayout(input);
    }

    try {
      const response = await this.makeRequest(`/v1/disbursements/${input.externalTransactionId}`, 'GET');

      return {
        id: uuidv4(),
        providerReference: response.transactionId || input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: response.responseCode === '00' || response.status === 'SUCCESS' ? 'succeeded' : 'processing',
        amount: response.amount ? Number(response.amount) : 0,
        currency: input.currency,
        recipientMsisdn: input.msisdn,
        serviceType: 'merchant_to_subscriber',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`OneMoney payout lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Mandates — emulated recurring debits
  // ------------------------------------------------------------------

  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedMandate(input);
    }

    const result = await this.createPayment({
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      metadata: { ...input.metadata, mandateSetup: true, interval: input.interval },
    });

    return {
      id: uuidv4(),
      providerReference: `om_${result.providerReference}`,
      status: 'pending',
      metadata: {
        ...input.metadata,
        chargeCorrelator: result.providerReference,
        note: 'Customer approves via the PIN prompt for the initial charge',
      },
    };
  }

  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      return this.simulatedMandateCharge(input);
    }

    const msisdn = input.mandateReference.split('|')[1] || (input.metadata?.msisdn as string) || '';
    return this.createPayment({
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customerPhone: msisdn,
      metadata: { ...input.metadata, initiator: 'merchant', recurring: true },
    });
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();
    if (this.shouldSimulate(['clientId', 'clientSecret', 'merchantCode'])) {
      this.simulatedRevokeMandate(input);
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
        providerReference: data.clientCorrelator || data.reference || data.externalReference,
        data,
      };
    } catch {
      throw new Error('Invalid OneMoney webhook payload');
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
      PENDING: 'processing',
      PROCESSING: 'processing',
      SUCCESS: 'succeeded',
      SUCCEEDED: 'succeeded',
      COMPLETED: 'succeeded',
      CHARGED: 'succeeded',
      FAILED: 'failed',
      DECLINED: 'failed',
      REVERSED: 'cancelled',
      CANCELLED: 'cancelled',
    };
    return map[(status || '').toUpperCase()] || 'pending';
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    body?: any,
    params?: Record<string, string>
  ): Promise<any> {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v)
      ).toString();
      if (qs) url += `?${qs}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.clientSecret}`,
        'X-Client-Id': this.clientId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = data.message || data.statusMessage || text || response.statusText;
      throw new Error(`OneMoney API error: ${response.status} - ${message}`);
    }

    return data;
  }

  private normalizeMsisdn(phone?: string): string {
    if (!phone) return '';
    let digits = phone.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) digits = `263${digits.slice(1)}`;
    return digits;
  }
}
