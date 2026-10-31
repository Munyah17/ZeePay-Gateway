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
  private mandates: Map<string, MandateResult> = new Map();

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
    // Intentionally a no-op — state persists across initialize() calls so
    // mandate flows (create → charge → revoke) work across separate service
    // invocations. Use reset() for explicit test isolation.
  }

  /** Clear all in-memory payments/mandates (test isolation). */
  reset(): void {
    this.payments.clear();
    this.mandates.clear();
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
   * Create a mandate for recurring debits / card tokenisation.
   * In mock mode, mandates are created in 'active' status immediately
   * (simulating instant customer approval in test environment).
   * Card metadata is simulated for tokenisation flows — real card
   * details would come from the gateway registration response.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();

    const providerReference = `mandate_${uuidv4()}`;
    const simulatedCard = (input.metadata?.card as Record<string, any>) || {
      brand: 'visa',
      last4: '4242',
      expMonth: '12',
      expYear: String(new Date().getFullYear() + 2),
      holder: 'TEST CARDHOLDER',
    };

    const result: MandateResult = {
      id: uuidv4(),
      providerReference,
      status: 'active',
      metadata: {
        amount: input.amount,
        currency: input.currency,
        interval: input.interval,
        card: simulatedCard,
        ...input.metadata,
      },
      providerResponse: {
        registrationId: providerReference,
        card: simulatedCard,
      },
    };

    this.mandates.set(providerReference, result);
    return result;
  }

  /**
   * Charge an active mandate — merchant-initiated auto-deduct.
   * No customer interaction needed once the mandate is active.
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const mandate = this.mandates.get(input.mandateReference);
    if (!mandate) {
      throw new Error(`Mandate ${input.mandateReference} not found`);
    }
    if (mandate.status !== 'active') {
      throw new Error(`Cannot charge mandate with status ${mandate.status}`);
    }

    // Tests/simulator can force a failure via mandate metadata or
    // per-charge metadata.simulateOutcome
    const simulateOutcome =
      input.metadata?.simulateOutcome || (mandate.metadata as any)?.simulateOutcome;

    const providerReference = `mock_${uuidv4()}`;
    const result: PaymentResult = {
      id: uuidv4(),
      providerReference,
      // Mock auto-deduct completes immediately
      status: simulateOutcome === 'failed' ? 'failed' : 'succeeded',
      amount: input.amount,
      currency: input.currency,
      metadata: {
        mandateReference: input.mandateReference,
        ...input.metadata,
      },
    };

    this.payments.set(providerReference, result);
    return result;
  }

  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();

    const mandate = this.mandates.get(input.mandateReference);
    if (!mandate) {
      throw new Error(`Mandate ${input.mandateReference} not found`);
    }

    mandate.status = 'revoked';
    this.mandates.set(input.mandateReference, mandate);
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

  /**
   * Force the outcome of the next mandate charge (for testing failed
   * auto-deducts / retries).
   */
  simulateMandateOutcome(mandateReference: string, outcome: 'success' | 'failed'): void {
    const mandate = this.mandates.get(mandateReference);
    if (mandate) {
      mandate.metadata = { ...mandate.metadata, simulateOutcome: outcome === 'failed' ? 'failed' : undefined };
      this.mandates.set(mandateReference, mandate);
    }
  }
}
