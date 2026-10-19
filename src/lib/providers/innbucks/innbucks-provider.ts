import { BasePaymentProvider } from '../base';
import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  PaymentProviderCapabilities,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * InnBucks payment provider for Zimbabwe mobile money payments.
 * 
 * InnBucks is a mobile money platform operated by InnBucks (formerly CBZ).
 * This provider handles payment creation, status checking, and refunds through InnBucks's API.
 */
export class InnBucksProvider extends BasePaymentProvider {
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
      supportsRecurring: false,
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
      
      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapInnBucksStatus(response.status),
        checkoutUrl: response.checkoutUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`InnBucks payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

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
      await this.makeRequest('/health', 'GET');
      return true;
    } catch (error) {
      return false;
    }
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
