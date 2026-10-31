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
 * M-Pesa payment provider — Safaricom Daraja API.
 *
 * Implements:
 *  - Collections: Lipa Na M-Pesa Online (STK Push)
 *      POST /mpesa/stkpush/v1/processrequest  — customer PIN prompt
 *      POST /mpesa/stkpushquery/v1/query      — status by CheckoutRequestID
 *  - Refunds: Transaction Reversal
 *      POST /mpesa/reversal/v1/request
 *  - Payouts: B2C
 *      POST /mpesa/b2c/v1/paymentrequest
 *  - Auth: GET /oauth/v1/generate — Basic(consumerKey:consumerSecret)
 *    short-lived access_token.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   consumerKey, consumerSecret     Daraja app credentials (required)
 *   shortCode                       Business/till short code (required)
 *   passkey                         Lipa Na M-Pesa passkey (required)
 *   initiatorName                   B2C/reversal initiator user (payouts)
 *   securityCredential              Encrypted initiator password (payouts)
 *   commandId                       B2C command (default BusinessPayment)
 *   callbackUrl                     Public callback URL override
 *   baseUrl                         Optional override (defaults by environment)
 *
 * Provider references encode `checkoutRequestId|msisdn` so status
 * queries can resolve the initiating phone number.
 */
export class MpesaProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private consumerKey!: string;
  private consumerSecret!: string;
  private shortCode!: string;
  private passkey!: string;
  private initiatorName!: string;
  private securityCredential!: string;
  private commandId!: string;
  private callbackUrl?: string;

  readonly configSchema: ProviderConfigSchema = {
    consumerKey: { label: 'Consumer key', required: true, secret: true },
    consumerSecret: { label: 'Consumer secret', required: true, secret: true },
    shortCode: { label: 'Business short code', required: true, placeholder: '174379' },
    passkey: { label: 'Lipa Na M-Pesa passkey', required: true, secret: true },
    initiatorName: { label: 'Initiator name (B2C/reversal)', required: false },
    securityCredential: { label: 'Security credential (B2C/reversal)', required: false, secret: true },
    commandId: { label: 'B2C command ID', required: false, placeholder: 'BusinessPayment' },
    callbackUrl: { label: 'Callback URL override', required: false },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  constructor() {
    super('mpesa', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Daraja has no pull/recurring product — ZeePay emulates mandates:
      // each auto-deduct issues a fresh STK push (customer PIN prompt
      // still applies on live rails).
      supportsRecurring: true,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('M-Pesa provider requires configuration');
    }

    const c = this.config.credentials;
    this.consumerKey = (c.consumerKey || '') as string;
    this.consumerSecret = (c.consumerSecret || '') as string;
    this.shortCode = (c.shortCode || '') as string;
    this.passkey = (c.passkey || '') as string;
    this.initiatorName = (c.initiatorName || '') as string;
    this.securityCredential = (c.securityCredential || '') as string;
    this.commandId = (c.commandId || 'BusinessPayment') as string;
    this.callbackUrl = (c.callbackUrl as string) || undefined;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke');
  }

  // ------------------------------------------------------------------
  // Collections — STK Push
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'shortCode', 'passkey'])) {
      return this.simulatedPayment(input);
    }

    const msisdn = this.normalizeMsisdn(input.customerPhone);
    const timestamp = this.timestamp();

    const body = {
      BusinessShortCode: this.shortCode,
      Password: Buffer.from(`${this.shortCode}${this.passkey}${timestamp}`).toString('base64'),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(input.amount),
      PartyA: msisdn,
      PartyB: this.shortCode,
      PhoneNumber: msisdn,
      CallBackURL: this.callbackUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/mpesa`,
      AccountReference: input.reference.slice(0, 12),
      TransactionDesc: (input.metadata?.description as string) || 'ZeePay payment',
    };

    try {
      const token = await this.getToken();
      const response = await this.darajaRequest('/mpesa/stkpush/v1/processrequest', body, token);

      // ResponseCode '0' means the push was dispatched; the payment is
      // still pending until the customer enters their PIN.
      if (response.ResponseCode !== '0' && response.ResponseCode !== 0) {
        throw new Error(`STK push rejected: ${response.ResponseDescription || response.errorMessage}`);
      }

      return {
        id: uuidv4(),
        providerReference: `${response.CheckoutRequestID}|${msisdn}`,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`M-Pesa payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'shortCode', 'passkey'])) {
      return this.simulatedGetPayment(input);
    }

    const [checkoutId] = input.providerReference.split('|');
    const timestamp = this.timestamp();

    const body = {
      BusinessShortCode: this.shortCode,
      Password: Buffer.from(`${this.shortCode}${this.passkey}${timestamp}`).toString('base64'),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutId,
    };

    try {
      const token = await this.getToken();
      const response = await this.darajaRequest('/mpesa/stkpushquery/v1/query', body, token);

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapResultCode(response.ResultCode),
        amount: 0, // stkpushquery does not echo the amount
        currency: 'KES',
        metadata: { resultDesc: response.ResultDesc },
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`M-Pesa payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'initiatorName', 'securityCredential'])) {
      return this.simulatedRefund(input);
    }

    const [transactionId] = input.paymentReference.split('|');
    const body = {
      Initiator: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: 'TransactionReversal',
      TransactionID: transactionId,
      Amount: Math.round(input.amount),
      ReceiverParty: this.shortCode,
      RecieverIdentifierType: '4', // short code
      ResultURL: this.callbackUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/mpesa`,
      QueueTimeOutURL: this.callbackUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/mpesa`,
      Remarks: input.reason || 'ZeePay refund',
      Occasion: 'Refund',
    };

    try {
      const token = await this.getToken();
      const response = await this.darajaRequest('/mpesa/reversal/v1/request', body, token);

      return {
        id: uuidv4(),
        providerReference: response.ConversationID || uuidv4(),
        status: response.ResponseCode === '0' ? 'processing' : 'failed',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`M-Pesa reversal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Payouts — B2C
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || uuidv4();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'initiatorName', 'securityCredential'])) {
      return this.simulatedPayout(input, externalReference);
    }

    const body = {
      InitiatorName: this.initiatorName,
      SecurityCredential: this.securityCredential,
      CommandID: this.commandId,
      Amount: Math.round(input.amount),
      PartyA: this.shortCode,
      PartyB: this.normalizeMsisdn(input.recipientMsisdn),
      Remarks: input.transferReference || 'ZeePay payout',
      QueueTimeOutURL: this.callbackUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/mpesa`,
      ResultURL: this.callbackUrl || `${config.app.baseUrl}/api/v1/provider-webhooks/mpesa`,
      Occasion: externalReference.slice(0, 100),
    };

    try {
      const token = await this.getToken();
      const response = await this.darajaRequest('/mpesa/b2c/v1/paymentrequest', body, token);

      return {
        id: uuidv4(),
        providerReference: response.ConversationID || externalReference,
        externalReference,
        status: response.ResponseCode === '0' ? 'processing' : 'failed',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`M-Pesa payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    // Daraja resolves B2C results asynchronously via ResultURL — there is
    // no synchronous status query. Report processing unless the webhook
    // already updated the payout record upstream.
    if (this.shouldSimulate(['consumerKey', 'consumerSecret'])) {
      return this.simulatedGetPayout(input);
    }
    return {
      id: uuidv4(),
      providerReference: input.externalTransactionId,
      externalReference: input.externalTransactionId,
      status: 'processing',
      amount: 0,
      currency: input.currency,
      recipientMsisdn: input.msisdn,
      serviceType: 'merchant_to_subscriber',
      providerResponse: { note: 'B2C results arrive via ResultURL callback' },
    };
  }

  // ------------------------------------------------------------------
  // Mandates — emulated (STK push per debit)
  // ------------------------------------------------------------------

  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'shortCode', 'passkey'])) {
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
      providerReference: `mnd_${result.providerReference}`,
      status: 'pending',
      metadata: {
        ...input.metadata,
        chargeReference: result.providerReference,
        note: 'Customer approves via the M-Pesa PIN prompt for the initial charge',
      },
    };
  }

  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['consumerKey', 'consumerSecret', 'shortCode', 'passkey'])) {
      return this.simulatedMandateCharge(input);
    }

    const msisdn = (input.metadata?.msisdn || input.mandateReference.split('|')[1] || '') as string;
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
    if (this.shouldSimulate(['consumerKey', 'consumerSecret'])) {
      this.simulatedRevokeMandate(input);
    }
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    // Daraja callbacks are unsigned; the configured secret is optional
    // for partner-proxied callbacks.
    if (!secret) return true;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
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
      const stk = data?.Body?.stkCallback;
      if (stk) {
        return {
          eventType: stk.ResultCode === 0 ? 'payment.succeeded' : 'payment.failed',
          providerReference: stk.CheckoutRequestID,
          data,
        };
      }
      const result = data?.Result;
      return {
        eventType: result?.ResultCode === 0 ? 'payout.succeeded' : 'payout.failed',
        providerReference: result?.ConversationID || result?.OriginatorConversationID,
        data,
      };
    } catch {
      throw new Error('Invalid M-Pesa webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      if (this.shouldSimulate(['consumerKey', 'consumerSecret'])) return true;
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private mapResultCode(code: string | number): PaymentStatus {
    const c = String(code ?? '');
    if (c === '0') return 'succeeded';
    if (c === '1032' || c === '1037') return 'cancelled'; // user cancelled / timeout
    if (c && c !== '0') return 'failed';
    return 'processing';
  }

  private async getToken(): Promise<string> {
    const basic = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basic}` },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`M-Pesa auth error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async darajaRequest(endpoint: string, body: any, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = data.errorMessage || data.ResponseDescription || text || response.statusText;
      throw new Error(`M-Pesa API error: ${response.status} - ${message}`);
    }

    return data;
  }

  private normalizeMsisdn(phone?: string): string {
    if (!phone) return '';
    let digits = phone.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
    return digits;
  }

  private timestamp(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
  }
}
