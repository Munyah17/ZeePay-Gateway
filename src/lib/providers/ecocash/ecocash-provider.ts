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
 * EcoCash payment provider for Zimbabwe mobile money payments.
 * 
 * EcoCash is Zimbabwe's largest mobile money platform operated by Econet Wireless.
 * This provider handles payment creation, status checking, and refunds through EcoCash's API.
 */
export class EcoCashProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private apiKey!: string;
  private merchantCode!: string;

  constructor() {
    super('ecocash', 'mobile_money');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Recurring is provided via ZeePay mandates (debit-order style
      // standing authorization) layered on top of EcoCash debits.
      supportsRecurring: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('EcoCash provider requires configuration');
    }

    const credentials = this.config.credentials;
    this.apiKey = credentials.apiKey as string;
    this.merchantCode = credentials.merchantCode as string;

    // Set base URL based on environment
    this.baseUrl = this.config.environment === 'live'
      ? 'https://api.ecocash.co.zw/v1'
      : 'https://sandbox.ecocash.co.zw/v1';
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    // Validate phone number for EcoCash (Zimbabwe format)
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
        status: this.mapEcoCashStatus(response.status),
        checkoutUrl: response.checkoutUrl,
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

    try {
      const response = await this.makeRequest(`/payments/${input.providerReference}`, 'GET');
      
      return {
        id: response.transactionId,
        providerReference: response.reference,
        status: this.mapEcoCashStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        metadata: response.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();

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
      throw new Error(`EcoCash refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error('Invalid EcoCash webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      await this.makeRequest('/health', 'GET');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create an EcoCash debit-order mandate.
   * The customer authorizes future debits once (USSD/PIN prompt),
   * after which the merchant can debit without further interaction.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();

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
      throw new Error(`EcoCash mandate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Debit an active mandate — merchant-initiated transaction (auto-deduct).
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();

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
        status: this.mapEcoCashStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`EcoCash mandate debit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();

    try {
      await this.makeRequest(`/mandates/${input.mandateReference}`, 'DELETE', {
        reason: input.reason,
      });
    } catch (error) {
      throw new Error(`EcoCash mandate revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * Validate and format Zimbabwe phone number for EcoCash
   * Accepts formats: +2637XX, 2637XX, 07XX, 7XX
   */
  private validateAndFormatPhoneNumber(phone?: string): string {
    if (!phone) {
      throw new Error('Phone number is required for EcoCash payments');
    }

    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('263')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // EcoCash numbers start with 7 (71, 73, 74, 77, 78)
    if (!cleaned.startsWith('7') || cleaned.length !== 9) {
      throw new Error('Invalid EcoCash phone number format');
    }

    return `263${cleaned}`;
  }

  /**
   * Map EcoCash status to ZeePay status
   */
  private mapEcoCashStatus(ecocashStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REJECTED': 'failed',
    };

    return statusMap[ecocashStatus.toUpperCase()] || 'pending';
  }

  /**
   * Map EcoCash refund status to ZeePay refund status
   */
  private mapRefundStatus(ecocashStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'REJECTED': 'failed',
    };

    return statusMap[ecocashStatus.toUpperCase()] || 'pending';
  }

  /**
   * Make HTTP request to EcoCash API
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
      throw new Error(`EcoCash API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
