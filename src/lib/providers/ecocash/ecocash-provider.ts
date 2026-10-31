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
 * EcoCash payment provider for Zimbabwe mobile money payments.
 *
 * Implements the real EcoCash developer API (developers.ecocash.co.zw):
 *
 *  - Online Payments (collections): POST /payment/v1/transactions/amount/
 *    HTTP Basic auth. The customer confirms with a PIN prompt. Refunds and
 *    reversals share POST /payment/v1/transactions/refund/ (tranType REF/REV).
 *    Lookup: GET /payment/v1/{endUserId}/transactions/amount/{clientCorrelator}.
 *
 *  - EPG services (disbursements + lookup): all POST to one endpoint,
 *    /api/serviceRequest, selected by the serviceType field:
 *      ENTERPRISECASHINV2      Enterprise Cash-In (bulk disbursement)
 *      CHANGEDISBURSEV2        Disburse Change (POS change into wallet)
 *      MERCHTOSUBV2            Merchant to Subscriber payout
 *      EXTERNALTRANSACTIONLOOKUP  Transaction lookup by externalReference
 *    Authenticated by X-Client-Id / X-Client-Secret headers plus a channel
 *    API user (username + encrypted password) in the body.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   clientId, clientSecret            EPG client credentials (headers)
 *   username, password                Channel API user for EPG services
 *   encryptionKey                     Used to encrypt `password` at call time
 *   onlineUsername, onlinePassword    Basic auth for Online Payments
 *   merchantCode, merchantPin         Merchant identifier + sandbox PIN
 *   merchantNumber                    Registered merchant MSISDN
 *   terminalId, location              POS terminal identifier + merchant location
 *   merchantName, superMerchantName   Display names
 *   baseUrl                           Optional override (defaults by environment)
 */
export class EcoCashProvider extends BasePaymentProvider {
  readonly configSchema: ProviderConfigSchema = {
    onlineUsername: { label: 'Instant Payment username', required: true },
    onlinePassword: { label: 'Instant Payment password', required: true, secret: true },
    merchantCode: { label: 'Merchant code', required: true },
    merchantNumber: { label: 'Merchant MSISDN (263...)', required: true },
    merchantPin: { label: 'Merchant PIN', required: true, secret: true },
    clientId: { label: 'EPG X-Client-Id', required: false },
    clientSecret: { label: 'EPG X-Client-Secret', required: false, secret: true },
    username: { label: 'EPG channel API user', required: false },
    password: { label: 'EPG channel password', required: false, secret: true },
    encryptionKey: { label: 'EPG encryption key', required: false, secret: true },
    terminalId: { label: 'Terminal ID', required: false },
    location: { label: 'Merchant location', required: false },
    merchantName: { label: 'Merchant display name', required: false },
  };

  private baseUrl!: string;
  private clientId!: string;
  private clientSecret!: string;
  private channelUsername!: string;
  private channelPassword!: string;
  private encryptionKey?: string;
  private onlineUsername!: string;
  private onlinePassword!: string;
  private merchantCode!: string;
  private merchantPin!: string;
  private merchantNumber!: string;
  private terminalId!: string;
  private location!: string;
  private merchantName!: string;
  private superMerchantName!: string;

  // Same-session maps so refund/lookup calls can resolve EcoCash references
  // (the Online Payments lookup is keyed on endUserId + clientCorrelator).
  private correlatorIndex: Map<string, { msisdn: string; ecocashReference?: string }> = new Map();

  constructor() {
    super('ecocash', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // EcoCash has no native recurring/debit-order API. Recurring billing is
      // emulated: the first Online Payments charge acts as the mandate setup,
      // and each auto-deduct issues a fresh merchant-initiated charge.
      supportsRecurring: true,
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('EcoCash provider requires configuration');
    }

    const c = this.config.credentials;
    this.clientId = (c.clientId || c.apiKey || '') as string;
    this.clientSecret = (c.clientSecret || '') as string;
    this.channelUsername = (c.username || '') as string;
    this.channelPassword = (c.password || '') as string;
    this.encryptionKey = c.encryptionKey as string | undefined;
    this.onlineUsername = (c.onlineUsername || c.username || '') as string;
    this.onlinePassword = (c.onlinePassword || c.password || '') as string;
    this.merchantCode = (c.merchantCode || '') as string;
    this.merchantPin = (c.merchantPin || '0000') as string;
    this.merchantNumber = (c.merchantNumber || '') as string;
    this.terminalId = (c.terminalId || 'WEB00001') as string;
    this.location = (c.location || 'Harare') as string;
    this.merchantName = (c.merchantName || 'ZeePay Merchant') as string;
    this.superMerchantName = (c.superMerchantName || 'ECOCASH') as string;

    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://epg.ecocash.co.zw'
        : 'https://developers.ecocash.co.zw');
  }

  // ------------------------------------------------------------------
  // Collections — Online Payments API
  // ------------------------------------------------------------------

  private static readonly ONLINE_KEYS = ['onlineUsername', 'onlinePassword', 'merchantCode', 'merchantNumber'];
  private static readonly EPG_KEYS = ['clientId', 'clientSecret', 'username', 'password'];

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.ONLINE_KEYS)) {
      return this.simulatedPayment(input);
    }

    const correlator = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const endUserId = this.normalizeMsisdn(input.customerPhone);

    const body = {
      clientCorrelator: correlator,
      referenceCode: input.reference,
      tranType: 'MER',
      endUserId,
      paymentAmount: {
        charginginformation: {
          amount: input.amount,
          currency: input.currency || 'USD',
          description: (input.metadata?.description as string) || 'ZeePay Online Payment',
        },
        chargeMetaData: {
          channel: 'WEB',
          purchaseCategoryCode: 'Online Payment',
          onBeHalfOf: this.superMerchantName,
        },
      },
      merchantCode: this.merchantCode,
      merchantPin: this.merchantPin,
      merchantNumber: this.merchantNumber,
      countryCode: 'ZW',
      terminalID: this.terminalId,
      location: this.location,
      superMerchantName: this.superMerchantName,
      merchantName: this.merchantName,
      // Top-level callback URL — EcoCash posts wallet state lifecycle events
      // here. Defaults to ZeePay's inbound webhook receiver so PIN-prompt
      // completions resolve automatically; merchants can override via metadata.
      notifyUrl:
        input.metadata?.notifyUrl ||
        `${config.app.baseUrl}/api/v1/provider-webhooks/ecocash`,
    };

    try {
      const response = await this.onlineRequest('/transactions/amount/', 'POST', body);

      this.correlatorIndex.set(correlator, {
        msisdn: endUserId,
        ecocashReference: response.ecocashReference,
      });

      return {
        id: uuidv4(),
        // Composite reference: correlator|msisdn so later lookups can resolve
        // the customer number the Online Payments lookup endpoint requires.
        providerReference: `${correlator}|${endUserId}`,
        status: this.mapOnlineStatus(response),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.ONLINE_KEYS)) {
      return this.simulatedGetPayment(input);
    }

    const { correlator, msisdn } = this.resolveCorrelator(input.providerReference);

    try {
      const response = await this.onlineRequest(
        `/${msisdn}/transactions/amount/${correlator}`,
        'GET'
      );

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapOnlineStatus(response),
        amount: response.paymentAmount?.charginginformation?.amount ?? 0,
        currency: response.paymentAmount?.charginginformation?.currency || 'USD',
        metadata: response.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.ONLINE_KEYS)) {
      return this.simulatedRefund(input);
    }

    const { correlator, msisdn } = this.resolveCorrelator(input.paymentReference);

    // The refund endpoint needs the original ecocashReference (MP…), which we
    // resolve via the transaction lookup when it isn't cached in-process.
    let originalEcocashReference = this.correlatorIndex.get(correlator)?.ecocashReference
      || input.metadata?.originalEcocashReference;

    if (!originalEcocashReference) {
      const original = await this.getPayment({ providerReference: input.paymentReference });
      originalEcocashReference = original.providerResponse?.ecocashReference;
    }
    if (!originalEcocashReference) {
      throw new Error('Cannot refund: original EcoCash reference could not be resolved');
    }

    const refundCorrelator = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const body = {
      clientCorrelator: refundCorrelator,
      referenceCode: `REF-${correlator}`,
      tranType: 'REF',
      endUserId: msisdn,
      originalEcocashReference,
      paymentAmount: {
        charginginformation: {
          amount: input.amount,
          currency: input.currency,
          description: input.reason || 'ZeePay Refund',
        },
        chargeMetaData: { channel: 'WEB' },
      },
      merchantCode: this.merchantCode,
      merchantPin: this.merchantPin,
      merchantNumber: this.merchantNumber,
      countryCode: 'ZW',
      terminalID: this.terminalId,
      location: this.location,
      superMerchantName: this.superMerchantName,
      merchantName: this.merchantName,
    };

    try {
      const response = await this.onlineRequest('/transactions/refund/', 'POST', body);

      return {
        id: uuidv4(),
        providerReference: refundCorrelator,
        status: response.transactionOperationStatus === 'Refunded' ? 'succeeded' : 'pending',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Disbursements — EPG serviceRequest endpoint
  // ------------------------------------------------------------------

  /**
   * Send money out to a customer wallet.
   * serviceType selects the EPG service:
   *   'enterprise_cash_in'     → ENTERPRISECASHINV2  (channel 700002)
   *   'change_disbursement'    → CHANGEDISBURSEV2    (channel 800002)
   *   'merchant_to_subscriber' → MERCHTOSUBV2        (channel 800004)
   */
  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    const service = this.payoutServiceConfig(input.serviceType);
    const earlyExternalReference = input.externalReference || `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    if (this.shouldSimulate(EcoCashProvider.EPG_KEYS)) {
      return this.simulatedPayout(input, earlyExternalReference);
    }

    const msisdn = this.normalizeMsisdnEpg(input.recipientMsisdn);
    const externalReference = earlyExternalReference;

    const base = {
      serviceType: service.code,
      externalReference,
      amount: String(input.amount),
      currency: input.currency,
      transferReference: input.transferReference || 'ZeePay Payout',
      username: this.channelUsername,
      password: this.encryptedChannelPassword(),
      channelCode: service.channelCode,
    };

    let body: Record<string, any>;
    switch (service.code) {
      case 'ENTERPRISECASHINV2':
        body = {
          ...base,
          beneficiaryReference: input.beneficiaryReference || externalReference,
          msisdn,
          walletId: input.walletId || '12',
        };
        break;
      case 'CHANGEDISBURSEV2':
        body = {
          ...base,
          receiverNumber: msisdn,
          terminalId: input.terminalId || this.terminalId,
          merchantName: input.merchantName || this.merchantName,
        };
        break;
      case 'MERCHTOSUBV2':
      default:
        body = {
          ...base,
          msisdn,
          beneficiaryReference: input.beneficiaryReference || externalReference,
          walletId: input.walletId || '12',
        };
        break;
    }

    try {
      const response = await this.epgRequest(body);

      return {
        id: uuidv4(),
        providerReference: response.transactionId || externalReference,
        externalReference,
        status: response.responseCode === '00' ? 'succeeded' : 'failed',
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: msisdn,
        serviceType: service.code,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Look up an EPG transaction by the externalReference used when it was
   * created (EXTERNALTRANSACTIONLOOKUP — client credentials only).
   */
  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.EPG_KEYS)) {
      return this.simulatedGetPayout(input);
    }

    const body = {
      serviceType: 'EXTERNALTRANSACTIONLOOKUP',
      externalReference: `${Date.now()}${Math.floor(Math.random() * 10000)}`,
      externalTransactionId: input.externalTransactionId,
      currency: input.currency,
      msisdn: this.normalizeMsisdnEpg(input.msisdn),
    };

    try {
      const response = await this.epgRequest(body);

      if (response.responseCode === '888803') {
        throw new Error(`Transaction ${input.externalTransactionId} not found`);
      }

      return {
        id: uuidv4(),
        providerReference: response.transactionId || input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: response.statusCode === 'TS' || response.responseCode === '00' ? 'succeeded' : 'failed',
        amount: response.amount ? parseFloat(response.amount) : 0,
        currency: input.currency,
        recipientMsisdn: this.normalizeMsisdnEpg(input.msisdn),
        serviceType: 'EXTERNALTRANSACTIONLOOKUP',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash transaction lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ------------------------------------------------------------------
  // Mandates — recurring auto-deduct (emulated)
  // ------------------------------------------------------------------

  /**
   * EcoCash has no standing-mandate API. A mandate is modelled as a first
   * Online Payments charge which the customer approves with their PIN —
   * that approval doubles as their consent to the subscription. Subsequent
   * auto-deducts issue fresh merchant-initiated charges.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.ONLINE_KEYS)) {
      return this.simulatedMandate(input);
    }

    const result = await this.createPayment({
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: { ...input.metadata, mandateSetup: true, interval: input.interval },
    });

    const { correlator, msisdn } = this.resolveCorrelator(result.providerReference);
    const mandateReference = `ecm_${correlator}`;

    return {
      id: uuidv4(),
      providerReference: `${mandateReference}|${msisdn}`,
      status: 'pending',
      metadata: {
        ...input.metadata,
        chargeCorrelator: result.providerReference,
        note: 'Customer approves via the PIN prompt for the initial charge',
      },
    };
  }

  /**
   * Debit a mandate — a merchant-initiated Online Payments charge.
   * Note: real EcoCash still prompts the customer's PIN on each charge;
   * ZeePay surfaces this so merchants understand the live behaviour.
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(EcoCashProvider.ONLINE_KEYS)) {
      return this.simulatedMandateCharge(input);
    }

    const { msisdn } = this.resolveCorrelator(input.mandateReference);

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
    this.simulatedRevokeMandate(input);
    // EcoCash mandates are ZeePay-side records; nothing to cancel provider-side.
  }

  // ------------------------------------------------------------------
  // Webhooks / health
  // ------------------------------------------------------------------

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
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
    } catch (error) {
      throw new Error('Invalid EcoCash webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return true;
    } catch (error) {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private onlinePathPrefix(): string {
    return this.config?.environment === 'live' ? '/payment/v1' : '/sandbox/payment/v1';
  }

  /**
   * Online Payments request — HTTP Basic auth.
   */
  private async onlineRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${this.onlinePathPrefix()}${endpoint}`;
    const basic = Buffer.from(`${this.onlineUsername}:${this.onlinePassword}`).toString('base64');

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basic}`,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      // Instant Payment API errors carry { statusCode: 'E0xx', statusMessage }
      const code = data.statusCode || data.responseCode;
      const message = data.statusMessage || data.message || data.responseMessage || text || response.statusText;
      const err = new Error(`EcoCash API error: ${response.status}${code ? ` (${code})` : ''} - ${message}`) as Error & { code?: string };
      err.code = code;
      throw err;
    }

    // Online Payments reports business failures via responseCode in a 200/422 body
    if (data.responseCode && data.responseCode !== '00') {
      const err = new Error(
        `EcoCash declined (${data.responseCode}): ${data.message || data.responseMessage || 'transaction failed'}`
      ) as Error & { code?: string };
      err.code = data.responseCode;
      throw err;
    }

    return data;
  }

  /**
   * EPG serviceRequest — all disbursement services + transaction lookup
   * share this single endpoint, selected by serviceType.
   */
  private async epgRequest(body: Record<string, any>): Promise<any> {
    const url = `${this.baseUrl}/api/serviceRequest`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
        'X-Client-Secret': this.clientSecret,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const code = data.responseCode ? ` (${data.responseCode})` : '';
      throw new Error(`EcoCash EPG error: ${response.status}${code} - ${data.message || data.responseMessage || text || response.statusText}`);
    }

    return data;
  }

  /**
   * The channel API user password is sent encrypted against the issued
   * encryption key — a correctly-encrypted value is accepted each call.
   * If no key is configured the password is sent as provided (assuming it
   * is already in encrypted form).
   */
  private encryptedChannelPassword(): string {
    if (!this.encryptionKey) {
      return this.channelPassword;
    }

    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(this.channelPassword, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, encrypted]).toString('base64');
  }

  /**
   * Online Payments endUserId: 9-digit local MSISDN (e.g. 773047653).
   */
  private normalizeMsisdn(phone?: string): string {
    if (!phone) {
      throw new Error('Phone number is required for EcoCash payments');
    }

    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('263')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    if (!cleaned.startsWith('7') || cleaned.length !== 9) {
      throw new Error('Invalid EcoCash phone number format');
    }

    return cleaned;
  }

  /**
   * EPG msisdn: international format (e.g. 263777000000).
   */
  private normalizeMsisdnEpg(phone?: string): string {
    return `263${this.normalizeMsisdn(phone)}`;
  }

  /**
   * Provider references carry `correlator|msisdn` so that the Online
   * Payments lookup (keyed on endUserId + clientCorrelator) stays
   * resolvable across processes without extra storage.
   */
  private resolveCorrelator(providerReference: string): { correlator: string; msisdn: string } {
    if (providerReference.includes('|')) {
      const [correlator, msisdn] = providerReference.split('|');
      return { correlator, msisdn };
    }

    const cached = this.correlatorIndex.get(providerReference);
    if (!cached) {
      throw new Error(
        `Cannot resolve ${providerReference}: the Online Payments lookup needs the customer MSISDN. ` +
        'Provider references include it as "correlator|msisdn".'
      );
    }
    return { correlator: providerReference, msisdn: cached.msisdn };
  }

  private payoutServiceConfig(serviceType?: string): { code: string; channelCode: string } {
    switch (serviceType) {
      case 'enterprise_cash_in':
      case 'ENTERPRISECASHINV2':
        return { code: 'ENTERPRISECASHINV2', channelCode: '700002' };
      case 'change_disbursement':
      case 'CHANGEDISBURSEV2':
        return { code: 'CHANGEDISBURSEV2', channelCode: '800002' };
      case 'merchant_to_subscriber':
      case 'MERCHTOSUBV2':
      default:
        return { code: 'MERCHTOSUBV2', channelCode: '800004' };
    }
  }

  /**
   * Map Online Payments transactionOperationStatus/responseCode to ZeePay status.
   */
  private mapOnlineStatus(response: any): PaymentStatus {
    if (response.responseCode === '00') {
      switch ((response.transactionOperationStatus || '').toLowerCase()) {
        case 'charged':
          return 'succeeded';
        case 'refunded':
        case 'reversed':
          return 'cancelled';
        default:
          return 'processing';
      }
    }
    if (response.responseCode) {
      return 'failed';
    }
    return 'pending';
  }
}
