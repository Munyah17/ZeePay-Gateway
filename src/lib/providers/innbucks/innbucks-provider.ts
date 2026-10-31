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
  PaymentProviderCapabilities,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * InnBucks payment provider for Zimbabwe mobile money payments.
 *
 * InnBucks (Simbisa Brands) offers a Merchant API for integrated merchants.
 * Public API docs are gated — apply at https://www.innbucks.co.zw/index.php/home/merchants
 * (info@innbucks.co.zw, toll-free 569). The confirmed authorization flow:
 *   1. Merchant initiates a transaction → API returns an authorizationcode
 *      and authorizationexpires timestamp.
 *   2. The customer approves via the InnBucks app — either by entering the
 *      authorization code or via the deep link
 *      com.innbucks.customer://purchase?paymentToken=<authorizationcode>
 *   3. The payment completes once the customer confirms in-app.
 *
 * InnBucks migrated to Mambu (API-first core banking) in 2025, so its
 * merchant API surface is expected to expand.
 */
export class InnBucksProvider extends BasePaymentProvider {
  private static readonly REQUIRED_KEYS = ['apiKey', 'merchantId'];

  readonly configSchema = {
    apiKey: { label: 'API key', required: true, secret: true },
    merchantId: { label: 'Merchant ID', required: true },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

  private baseUrl!: string;
  private apiKey!: string;
  private merchantId!: string;

  constructor() {
    super('innbucks', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Recurring is provided via ZeePay mandates (debit-order style
      // standing authorization) layered on top of InnBucks debits.
      supportsRecurring: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('InnBucks provider requires configuration');
    }

    const credentials = this.config.credentials;
    this.apiKey = credentials.apiKey as string;
    this.merchantId = credentials.merchantId as string;

    // Set base URL based on environment
    this.baseUrl = this.config.environment === 'live'
      ? 'https://api.innbucks.co.zw/v1'
      : 'https://sandbox.innbucks.co.zw/v1';
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
      return this.simulatedPayment(input);
    }

    // Validate phone number for InnBucks (Zimbabwe format)
    const phoneNumber = this.validateAndFormatPhoneNumber(input.customerPhone);

    const payload = {
      merchantId: this.merchantId,
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

      // InnBucks returns an authorizationcode the customer uses to approve
      // the payment inside the InnBucks app. The deep link opens the app
      // directly to the purchase confirmation screen.
      const authorizationCode = response.authorizationcode || response.authorizationCode;
      const deepLink = authorizationCode
        ? `com.innbucks.customer://purchase?paymentToken=${authorizationCode}`
        : undefined;

      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapInnBucksStatus(response.status),
        // Prefer the app deep link over any web checkout URL
        checkoutUrl: deepLink || response.checkoutUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: {
          ...input.metadata,
          authorizationcode: authorizationCode,
          authorizationexpires: response.authorizationexpires || response.authorizationExpires,
        },
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`InnBucks payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
      return this.simulatedGetPayment(input);
    }

    try {
      const response = await this.makeRequest(`/payments/${input.providerReference}`, 'GET');
      
      return {
        id: response.transactionId,
        providerReference: response.reference,
        status: this.mapInnBucksStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        metadata: response.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`InnBucks payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
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
      throw new Error(`InnBucks refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error('Invalid InnBucks webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) return true;
      await this.makeRequest('/health', 'GET');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create an InnBucks debit-order mandate.
   * The customer authorizes future debits once, after which the
   * merchant can debit without further interaction.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
      return this.simulatedMandate(input);
    }

    const phoneNumber = this.validateAndFormatPhoneNumber(input.customerPhone);

    const payload = {
      merchantId: this.merchantId,
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
      throw new Error(`InnBucks mandate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Debit an active mandate — merchant-initiated transaction (auto-deduct).
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
      return this.simulatedMandateCharge(input);
    }

    const payload = {
      merchantId: this.merchantId,
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
        status: this.mapInnBucksStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`InnBucks mandate debit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();
    if (this.shouldSimulate(InnBucksProvider.REQUIRED_KEYS)) {
      this.simulatedRevokeMandate(input);
      return;
    }

    try {
      await this.makeRequest(`/mandates/${input.mandateReference}`, 'DELETE', {
        reason: input.reason,
      });
    } catch (error) {
      throw new Error(`InnBucks mandate revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
   * Validate and format Zimbabwe phone number for InnBucks
   * Accepts formats: +2637XX, 2637XX, 07XX, 7XX
   */
  private validateAndFormatPhoneNumber(phone?: string): string {
    if (!phone) {
      throw new Error('Phone number is required for InnBucks payments');
    }

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('263')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // InnBucks numbers start with 7 (71, 73, 74, 77, 78)
    if (!cleaned.startsWith('7') || cleaned.length !== 9) {
      throw new Error('Invalid InnBucks phone number format');
    }

    return `263${cleaned}`;
  }

  /**
   * Map InnBucks status to ZeePay status
   */
  private mapInnBucksStatus(innbucksStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REJECTED': 'failed',
    };

    return statusMap[innbucksStatus.toUpperCase()] || 'pending';
  }

  /**
   * Map InnBucks refund status to ZeePay refund status
   */
  private mapRefundStatus(innbucksStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'REJECTED': 'failed',
    };

    return statusMap[innbucksStatus.toUpperCase()] || 'pending';
  }

  /**
   * Make HTTP request to InnBucks API
   */
  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-ID': this.merchantId,
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
      throw new Error(`InnBucks API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
