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
  ProviderConfigSchema,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * Omari payment provider for Zimbabwe mobile money payments.
 *
 * Omari (Old Mutual Digital Services) offers merchant API integration for
 * online payments, B2C payouts and change disbursement into customer
 * wallets. API docs are gated behind business account registration at
 * https://omari.co.zw/register?form=business (WhatsApp +263774707707).
 * Merchant onboarding requires company documents (cert. of incorporation,
 * board resolution, CR6, tax clearance, director IDs).
 */
export class OmariProvider extends BasePaymentProvider {
  private static readonly REQUIRED_KEYS = ['apiKey', 'merchantCode'];

  readonly configSchema: ProviderConfigSchema = {
    apiKey: { label: 'API key', required: true, secret: true },
    merchantCode: { label: 'Merchant code', required: true },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  private baseUrl!: string;
  private apiKey!: string;
  private merchantCode!: string;

  constructor() {
    super('omari', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Recurring is provided via ZeePay mandates (debit-order style
      // standing authorization) layered on top of Omari debits.
      supportsRecurring: true,
      // Omari advertises B2C payouts and change disbursement to merchants.
      createPayout: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('Omari provider requires configuration');
    }

    const credentials = this.config.credentials;
    this.apiKey = credentials.apiKey as string;
    this.merchantCode = credentials.merchantCode as string;

    // Set base URL based on environment
    this.baseUrl = this.config.environment === 'live'
      ? 'https://api.omari.co.zw/v1'
      : 'https://sandbox.omari.co.zw/v1';
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedPayment(input);
    }

    // Validate phone number for Omari (Zimbabwe format)
    const phoneNumber = this.validateAndFormatPhoneNumber(input.customerPhone);

    const payload = {
      merchantCode: this.merchantCode,
      amount: input.amount,
      currency: input.currency || 'USD',
      reference: input.reference,
      customerPhone: phoneNumber,
      customerEmail: input.customerEmail,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/payments', 'POST', payload);
      
      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapOmariStatus(response.status),
        checkoutUrl: response.checkoutUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.makeRequest(`/payments/${input.providerReference}`, 'GET');
      
      return {
        id: response.transactionId,
        providerReference: response.reference,
        status: this.mapOmariStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        metadata: response.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedRefund(input);
    }

    const payload = {
      originalReference: input.paymentReference,
      amount: input.amount,
      currency: input.currency,
      reason: input.reason,
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/refunds', 'POST', payload);
      
      return {
        id: response.refundId || uuidv4(),
        providerReference: response.reference,
        status: this.mapRefundStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
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
        providerReference: data.reference,
        data,
      };
    } catch (error) {
      throw new Error('Invalid Omari webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) return true;
      await this.makeRequest('/health', 'GET');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create an Omari debit-order mandate.
   * The customer authorizes future debits once, after which the
   * merchant can debit without further interaction.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedMandate(input);
    }

    const phoneNumber = this.validateAndFormatPhoneNumber(input.customerPhone);

    const payload = {
      merchantCode: this.merchantCode,
      amount: input.amount,
      currency: input.currency || 'USD',
      reference: input.reference,
      interval: input.interval,
      customerPhone: phoneNumber,
      customerEmail: input.customerEmail,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/mandates', 'POST', payload);

      return {
        id: response.mandateId || uuidv4(),
        providerReference: response.reference,
        status: this.mapMandateStatus(response.status),
        approvalUrl: response.approvalUrl,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari mandate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Debit an active mandate — merchant-initiated transaction (auto-deduct).
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedMandateCharge(input);
    }

    const payload = {
      merchantCode: this.merchantCode,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      initiator: 'merchant',
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest(`/mandates/${input.mandateReference}/debit`, 'POST', payload);

      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapOmariStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari mandate debit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      this.simulatedRevokeMandate(input);
      return;
    }

    try {
      await this.makeRequest(`/mandates/${input.mandateReference}`, 'DELETE', {
        reason: input.reason,
      });
    } catch (error) {
      throw new Error(`Omari mandate revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disburse funds to a customer wallet — Omari advertises B2C payouts
   * and change disbursement to merchants (USD and ZWG).
   */
  async createPayout(input: PayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();

    const msisdn = this.normalizeMsisdnEpg(input.recipientMsisdn);
    const externalReference = input.externalReference || `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedPayout(input, externalReference);
    }

    const payload = {
      merchantCode: this.merchantCode,
      serviceType: input.serviceType === 'change_disbursement'
        ? 'CHANGEDISBURSEMENT'
        : input.serviceType === 'enterprise_cash_in'
          ? 'BULKDISBURSEMENT'
          : 'B2CPAYOUT',
      externalReference,
      amount: String(input.amount),
      currency: input.currency,
      msisdn,
      beneficiaryReference: input.beneficiaryReference || externalReference,
      transferReference: input.transferReference || 'ZeePay Payout',
      merchantName: input.merchantName || this.merchantCode,
      terminalId: input.terminalId,
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/disbursements', 'POST', payload);

      return {
        id: uuidv4(),
        providerReference: response.transactionId || externalReference,
        externalReference,
        status: response.responseCode === '00' ? 'succeeded' : this.mapPayoutStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        recipientMsisdn: msisdn,
        serviceType: input.serviceType,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Look up a payout/transaction by external reference.
   */
  async getPayout(input: GetPayoutInput): Promise<PayoutResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(OmariProvider.REQUIRED_KEYS)) {
      return this.simulatedGetPayout(input);
    }

    const msisdn = this.normalizeMsisdnEpg(input.msisdn);

    try {
      const response = await this.makeRequest(
        `/disbursements/lookup?externalReference=${encodeURIComponent(input.externalTransactionId)}&msisdn=${encodeURIComponent(msisdn)}`,
        'GET'
      );

      return {
        id: uuidv4(),
        providerReference: response.transactionId || input.externalTransactionId,
        externalReference: input.externalTransactionId,
        status: this.mapPayoutStatus(response.status),
        amount: response.amount ? parseFloat(response.amount) : 0,
        currency: input.currency,
        recipientMsisdn: msisdn,
        serviceType: 'lookup',
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Omari transaction lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapPayoutStatus(status: string): 'pending' | 'processing' | 'succeeded' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'SUCCEEDED': 'succeeded',
      'FAILED': 'failed',
      'REJECTED': 'failed',
    };

    return statusMap[(status || '').toUpperCase()] || 'pending';
  }

  /**
   * Omari msisdn: international format (263XXXXXXXXX) — same as the
   * phone validator already produces for payments.
   */
  private normalizeMsisdnEpg(phone?: string): string {
    return this.validateAndFormatPhoneNumber(phone);
  }

  private mapMandateStatus(status: string): 'pending' | 'active' | 'revoked' | 'failed' {
    const statusMap: Record<string, 'pending' | 'active' | 'revoked' | 'failed'> = {
      'PENDING': 'pending',
      'PENDING_APPROVAL': 'pending',
      'ACTIVE': 'active',
      'APPROVED': 'active',
      'REVOKED': 'revoked',
      'CANCELLED': 'revoked',
      'FAILED': 'failed',
      'REJECTED': 'failed',
    };

    return statusMap[status.toUpperCase()] || 'pending';
  }

  /**
   * Validate and format Zimbabwe phone number for Omari
   * Accepts formats: +2637XX, 2637XX, 07XX, 7XX
   */
  private validateAndFormatPhoneNumber(phone?: string): string {
    if (!phone) {
      throw new Error('Phone number is required for Omari payments');
    }

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('263')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Omari numbers start with 7 (71, 73, 74, 77, 78)
    if (!cleaned.startsWith('7') || cleaned.length !== 9) {
      throw new Error('Invalid Omari phone number format');
    }

    return `263${cleaned}`;
  }

  /**
   * Map Omari status to ZeePay status
   */
  private mapOmariStatus(omariStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REJECTED': 'failed',
    };

    return statusMap[omariStatus.toUpperCase()] || 'pending';
  }

  /**
   * Map Omari refund status to ZeePay refund status
   */
  private mapRefundStatus(omariStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'REJECTED': 'failed',
    };

    return statusMap[omariStatus.toUpperCase()] || 'pending';
  }

  /**
   * Make HTTP request to Omari API
   */
  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-Code': this.merchantCode,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Omari API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
