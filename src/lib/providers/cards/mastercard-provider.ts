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
 * Mastercard payment provider.
 * 
 * This provider handles Mastercard payments through card processing networks.
 * Supports 3D Secure verification and card-not-present transactions.
 */
export class MastercardProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private apiKey!: string;
  private merchantId!: string;

  constructor() {
    super('mastercard', 'card');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      supportsRecurring: true,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('Mastercard provider requires configuration');
    }

    const credentials = this.config.credentials;
    this.apiKey = credentials.apiKey as string;
    this.merchantId = credentials.merchantId as string;

    // Set base URL based on environment
    this.baseUrl = this.config.environment === 'live'
      ? 'https://api.cardprocessor.co.zw/v1'
      : 'https://sandbox.cardprocessor.co.zw/v1';
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const payload = {
      merchantId: this.merchantId,
      amount: input.amount,
      currency: input.currency || 'USD',
      reference: input.reference,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      cardType: 'mastercard',
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/payments', 'POST', payload);
      
      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapCardStatus(response.status),
        checkoutUrl: response.checkoutUrl,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Mastercard payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest(`/payments/${input.providerReference}`, 'GET');
      
      return {
        id: response.transactionId,
        providerReference: response.reference,
        status: this.mapCardStatus(response.status),
        amount: response.amount,
        currency: response.currency,
        metadata: response.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Mastercard payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Mastercard refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error('Invalid Mastercard webhook payload');
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
   * Map card processor status to ZeePay status
   */
  private mapCardStatus(cardStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'AUTHORIZED': 'processing',
      'CAPTURED': 'succeeded',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'DECLINED': 'failed',
      'CANCELLED': 'cancelled',
      'VOIDED': 'cancelled',
    };

    return statusMap[cardStatus.toUpperCase()] || 'pending';
  }

  /**
   * Map card processor refund status to ZeePay refund status
   */
  private mapRefundStatus(cardStatus: string): 'pending' | 'processing' | 'succeeded' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'succeeded' | 'failed'> = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'succeeded',
      'SUCCESS': 'succeeded',
      'FAILED': 'failed',
      'DECLINED': 'failed',
    };

    return statusMap[cardStatus.toUpperCase()] || 'pending';
  }

  /**
   * Make HTTP request to card processor API
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
      throw new Error(`Card processor API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
