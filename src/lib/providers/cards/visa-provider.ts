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
 * Visa card payment provider.
 * 
 * This provider handles Visa card payments through card processing networks.
 * Supports 3D Secure verification and card-not-present transactions.
 */
export class VisaProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private apiKey!: string;
  private merchantId!: string;

  constructor() {
    super('visa', 'card');
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
      throw new Error('Visa provider requires configuration');
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
      cardType: 'visa',
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
      throw new Error(`Visa payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Visa payment retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Visa refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error('Invalid Visa webhook payload');
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
   * Create a card mandate — tokenizes the customer's card during an
   * initial cardholder-present authorization so the merchant can
   * submit merchant-initiated transactions (MIT) afterwards.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();

    const payload = {
      merchantId: this.merchantId,
      cardType: 'visa',
      amount: input.amount,
      currency: input.currency || 'USD',
      reference: input.reference,
      interval: input.interval,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      storedCredential: 'CARDHOLDER_INITIATED',
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/tokens', 'POST', payload);

      return {
        id: response.tokenId || uuidv4(),
        providerReference: response.reference,
        status: this.mapMandateStatus(response.status),
        approvalUrl: response.approvalUrl,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Visa mandate creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Charge a tokenized card mandate — merchant-initiated transaction.
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const payload = {
      merchantId: this.merchantId,
      cardType: 'visa',
      token: input.mandateReference,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      initiator: 'merchant',
      recurringType: 'RECURRING',
      metadata: input.metadata,
    };

    try {
      const response = await this.makeRequest('/payments', 'POST', payload);

      return {
        id: response.transactionId || uuidv4(),
        providerReference: response.reference,
        status: this.mapCardStatus(response.status),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`Visa mandate charge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();

    try {
      await this.makeRequest(`/tokens/${input.mandateReference}`, 'DELETE', {
        reason: input.reason,
      });
    } catch (error) {
      throw new Error(`Visa mandate revocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
