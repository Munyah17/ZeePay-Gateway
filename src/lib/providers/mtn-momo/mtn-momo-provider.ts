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

/**
 * MTN MoMo payment provider (momodeveloper.mtn.com).
 *
 * Implements the real MoMo Open API products:
 *
 *  - Collection: POST /collection/v1_0/requesttopay — the customer
 *    approves via a USSD/app PIN prompt. Status lookup by the
 *    X-Reference-Id UUID we generate per request. Refunds via
 *    POST /collection/v1_0/refund.
 *  - Disbursement: POST /disbursement/v1_0/transfer — money out to a
 *    subscriber wallet; lookup via GET .../transfer/{referenceId}.
 *  - Auth: POST /{product}/token/ with HTTP Basic (apiUserId:apiKey)
 *    plus the Ocp-Apim-Subscription-Key header on every call.
 *
 * Provisioning note: the API user + API key are created via the
 * provisioning endpoints during onboarding (or in the developer
 * portal). ZeePay only needs the issued credentials.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   subscriptionKey    Ocp-Apim-Subscription-Key (required)
 *   apiUserId          Provisioned API user UUID (required)
 *   apiKey             Provisioned API key (required)
 *   targetEnvironment  X-Target-Environment: 'sandbox' | 'mtnzambia' |
 *                      'mtnuganda' | 'mtnghana' | ... (required)
 *   baseUrl            Optional override (defaults by environment)
 *   callbackHost       Optional X-Callback-Url host for server callbacks
 */
export class MtnMomoProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private subscriptionKey!: string;
  private apiUserId!: string;
  private apiKey!: string;
  private targetEnvironment!: string;
  private callbackHost?: string;

  readonly configSchema: ProviderConfigSchema = {
    subscriptionKey: { label: 'Ocp-Apim subscription key', required: true, secret: true },
    apiUserId: { label: 'API user ID (UUID)', required: true },
    apiKey: { label: 'API key', required: true, secret: true },
    targetEnvironment: { label: 'Target environment', required: true, placeholder: 'sandbox | mtnzambia | mtnuganda | mtnghana | ...', help: 'X-Target-Environment value from the MoMo developer portal' },
    callbackHost: { label: 'Callback host (optional)', required: false, placeholder: 'https://api.example.com' },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  constructor() {
    super('mtn-momo', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // MoMo has no standing-mandate product — ZeePay emulates recurring
      // debits: each auto-deduct is a fresh requesttopay (customer PIN
      // prompt still applies on live rails).
      supportsRecurring: true,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('MTN MoMo provider requires configuration');
    }

    const c = this.config.credentials;
    this.subscriptionKey = (c.subscriptionKey || '') as string;
    this.apiUserId = (c.apiUserId || '') as string;
    this.apiKey = (c.apiKey || '') as string;
    this.targetEnvironment =
      (c.targetEnvironment as string) ||
      (this.config.environment === 'live' ? 'mtnzambia' : 'sandbox');
    this.callbackHost = (c.callbackHost as string) || undefined;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com');
  }

  // ------------------------------------------------------------------
  // Collections — requesttopay
  // ------------------------------------------------------------------

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedPayment(input);
    }

    const referenceId = uuidv4();
    const token = await this.getToken('collection');

    const body = {
      amount: String(input.amount),
      currency: input.currency || 'USD',
      externalId: input.reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: this.normalizeMsisdn(input.customerPhone),
      },
      payerMessage: (input.metadata?.description as string) || 'ZeePay payment',
      payeeNote: `Ref ${input.reference}`,
    };

    try {
      // requesttopay returns 202 with an EMPTY body — the reference we
      // generated is the lookup key, not anything in the response.
      await this.momoRequest(
        'collection',
        '/collection/v1_0/requesttopay',
        'POST',
        body,
        token,
        referenceId
      );

      return {
        id: uuidv4(),
        providerReference: referenceId,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: { referenceId },
      };
    } catch (error) {
      throw new Error(`MTN MoMo payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedGetPayment(input);
    }

    try {
      const token = await this.getToken('collection');
      const response = await this.momoRequest(
        'collection',
        `/collection/v1_0/requesttopay/${input.providerReference}`,
        'GET',
        undefined,
        token
      );

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapMomoStatus(response.status),
        amount: response.amount ? parseFloat(response.amount) : 0,
        currency: response.currency || 'USD',
        metadata: response.reason ? { reason: response.reason } : undefined,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`MTN MoMo payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedRefund(input);
    }

    const referenceId = uuidv4();
    const body = {
      amount: String(input.amount),
      currency: input.currency || 'USD',
      externalId: `REF-${input.paymentReference}`,
      payerMessage: input.reason || 'ZeePay refund',
      payeeNote: `Refund for ${input.paymentReference}`,
      referenceIdToRefund: input.paymentReference,
    };

    try {
      const token = await this.getToken('collection');
      await this.momoRequest('collection', '/collection/v1_0/refund', 'POST', body, token, referenceId);

      return {
        id: uuidv4(),
        providerReference: referenceId,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: { referenceId },
      };
    } catch (error) {
      throw new Error(`MTN MoMo refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Disbursements — transfer
  // ------------------------------------------------------------------

  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const externalReference = input.externalReference || uuidv4();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedPayout(input, externalReference);
    }

    const referenceId = uuidv4();
    const body = {
      amount: String(input.amount),
      currency: input.currency || 'USD',
      externalId: externalReference,
      payee: {
        partyIdType: 'MSISDN',
        partyId: this.normalizeMsisdn(input.recipientMsisdn),
      },
      payerMessage: input.transferReference || 'ZeePay payout',
      payeeNote: input.transferReference || 'ZeePay payout',
    };

    try {
      const token = await this.getToken('disbursement');
      await this.momoRequest('disbursement', '/disbursement/v1_0/transfer', 'POST', body, token, referenceId);

      return {
        id: uuidv4(),
        providerReference: referenceId,
        externalReference,
        status: 'processing',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: input.recipientMsisdn,
        serviceType: input.serviceType,
        providerResponse: { referenceId },
      };
    } catch (error) {
      throw new Error(`MTN MoMo payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedGetPayout(input);
    }

    try {
      const token = await this.getToken('disbursement');
      const response = await this.momoRequest(
        'disbursement',
        `/disbursement/v1_0/transfer/${input.externalTransactionId}`,
        'GET',
        undefined,
        token
      );

      return {
        id: uuidv4(),
        providerReference: input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: this.mapMomoStatus(response.status) === 'succeeded' ? 'succeeded' : this.mapMomoStatus(response.status) === 'failed' ? 'failed' : 'processing',
        amount: response.amount ? parseFloat(response.amount) : 0,
        currency: input.currency,
        recipientMsisdn: input.msisdn,
        serviceType: 'merchant_to_subscriber',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`MTN MoMo payout lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Mandates — emulated recurring debits
  // ------------------------------------------------------------------

  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedMandate(input);
    }

    // First charge acts as the mandate setup — customer PIN approval
    // doubles as consent to the subscription.
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
      providerReference: `momo_${result.providerReference}`,
      status: 'pending',
      metadata: {
        ...input.metadata,
        chargeReference: result.providerReference,
        note: 'Customer approves via the MoMo PIN prompt for the initial charge',
      },
    };
  }

  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      return this.simulatedMandateCharge(input);
    }

    const msisdn = (input.metadata?.msisdn || '') as string;
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
    if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) {
      this.simulatedRevokeMandate(input);
    }
    // MoMo mandates are ZeePay-side records; nothing to cancel remotely.
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    // MoMo posts unsigned callbacks to the X-Callback-Url host; when a
    // secret is configured we additionally accept an HMAC so ZeePay
    // can verify partner-proxied callbacks.
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
      return {
        eventType: data.status === 'SUCCESSFUL' ? 'payment.succeeded' : data.status === 'FAILED' ? 'payment.failed' : 'payment.updated',
        providerReference: data.referenceId || data.externalId || data.financialTransactionId,
        data,
      };
    } catch {
      throw new Error('Invalid MTN MoMo webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      if (this.shouldSimulate(['subscriptionKey', 'apiUserId', 'apiKey'])) return true;
      await this.getToken('collection');
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private mapMomoStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PENDING: 'processing',
      SUCCESSFUL: 'succeeded',
      FAILED: 'failed',
      TIMEOUT: 'failed',
      REJECTED: 'failed',
    };
    return map[(status || '').toUpperCase()] || 'pending';
  }

  /**
   * OAuth2 token for a MoMo product — Basic(apiUserId:apiKey) plus the
   * subscription key. Tokens are short-lived; we request one per call
   * batch (safe default; add caching when traffic justifies it).
   */
  private async getToken(product: 'collection' | 'disbursement'): Promise<string> {
    const url = `${this.baseUrl}/${product}/token/`;
    const basic = Buffer.from(`${this.apiUserId}:${this.apiKey}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MTN MoMo auth error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async momoRequest(
    product: 'collection' | 'disbursement',
    endpoint: string,
    method: string,
    body: any,
    token: string,
    referenceId?: string
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'X-Target-Environment': this.targetEnvironment,
    };
    if (referenceId) headers['X-Reference-Id'] = referenceId;
    if (this.callbackHost) headers['X-Callback-Url'] = this.callbackHost;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = data.message || text || response.statusText;
      throw new Error(`MTN MoMo API error: ${response.status} - ${message}`);
    }

    return data;
  }

  private normalizeMsisdn(phone?: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
  }
}
