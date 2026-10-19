import { BasePaymentProvider } from '../base';
import {
  CreatePaymentInput,
  PaymentResult,
  GetPaymentInput,
  RefundPaymentInput,
  RefundResult,
  PaymentProviderCapabilities,
  PaymentStatus,
  RefundStatus,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock payment provider for testing and development.
 * Simulates payment flows without making real API calls.
 */
export class MockProvider extends BasePaymentProvider {
  private payments: Map<string, PaymentResult> = new Map();

  constructor() {
    super('mock', 'mock');
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
    // Clear payments on re-initialization for test isolation
    this.payments.clear();
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const providerReference = `mock_${uuidv4()}`;
    const paymentId = uuidv4();

    const result: PaymentResult = {
      id: paymentId,
      providerReference,
      status: 'pending',
      checkoutUrl: `https://checkout.zeepay.test/mock/${providerReference}`,
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
    };

    this.payments.set(providerReference, result);

    // Simulate async payment processing
    setTimeout(() => {
      const payment = this.payments.get(providerReference);
      if (payment) {
        payment.status = 'succeeded';
        this.payments.set(providerReference, payment);
      }
    }, 2000);

    return result;
  }

  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const payment = this.payments.get(input.providerReference);
    if (!payment) {
      throw new Error(`Payment ${input.providerReference} not found`);
    }

    return { ...payment };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();

    const payment = this.payments.get(input.paymentReference);
    if (!payment) {
      throw new Error(`Payment ${input.paymentReference} not found`);
    }

    if (payment.status !== 'succeeded') {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    const refundId = uuidv4();
    const providerReference = `refund_${uuidv4()}`;

    const result: RefundResult = {
      id: refundId,
      providerReference,
      status: 'succeeded',
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
    };

    return result;
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    // Mock verification - always return true in test mode
    return true;
  }

  parseWebhook(payload: string): {
    eventType: string;
    providerReference: string;
    data: Record<string, any>;
  } {
    try {
      const data = JSON.parse(payload);
      return {
        eventType: data.event || 'payment.updated',
        providerReference: data.providerReference,
        data,
      };
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Simulate payment status changes for testing
   */
  simulatePaymentStatus(providerReference: string, status: PaymentStatus): void {
    const payment = this.payments.get(providerReference);
    if (payment) {
      payment.status = status;
      this.payments.set(providerReference, payment);
    }
  }

  /**
   * Get all payments (for testing purposes)
   */
  getAllPayments(): PaymentResult[] {
    return Array.from(this.payments.values());
  }
}
