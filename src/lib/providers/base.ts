import {
  PaymentProvider,
} from './interface';
import { ProviderConfig } from '@/types/provider';
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

/**
 * Abstract base class for payment providers.
 * Provides common functionality and enforces implementation of required methods.
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  protected config: ProviderConfig | null = null;

  constructor(
    public readonly name: string,
    public readonly type: string
  ) {}

  /**
   * Initialize the provider with credentials
   */
  initialize(config: ProviderConfig): void {
    this.config = config;
    this.onInitialize(config);
  }

  /**
   * Hook for subclasses to perform additional initialization
   */
  protected onInitialize(config: ProviderConfig): void {
    // Override in subclasses if needed
  }

  /**
   * Ensure provider is initialized before use
   */
  protected ensureInitialized(): void {
    if (!this.config) {
      throw new Error(`Provider ${this.name} is not initialized`);
    }
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract getCapabilities(): PaymentProviderCapabilities;
  abstract createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  abstract getPayment(input: GetPaymentInput): Promise<PaymentResult>;

  /**
   * Optional methods with default implementations
   */
  async refundPayment?(input: RefundPaymentInput): Promise<RefundResult> {
    throw new Error(`Refund not supported by provider ${this.name}`);
  }

  async createMandate?(input: CreateMandateInput): Promise<MandateResult> {
    throw new Error(`Mandates not supported by provider ${this.name}`);
  }

  async chargeMandate?(input: ChargeMandateInput): Promise<PaymentResult> {
    throw new Error(`Mandate charges not supported by provider ${this.name}`);
  }

  async revokeMandate?(input: RevokeMandateInput): Promise<void> {
    throw new Error(`Mandate revocation not supported by provider ${this.name}`);
  }

  verifyWebhook?(payload: string, signature: string, secret: string): boolean {
    throw new Error(`Webhook verification not supported by provider ${this.name}`);
  }

  parseWebhook?(payload: string): {
    eventType: string;
    providerReference: string;
    data: Record<string, any>;
  } {
    throw new Error(`Webhook parsing not supported by provider ${this.name}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return true;
    } catch (error) {
      return false;
    }
  }
}
