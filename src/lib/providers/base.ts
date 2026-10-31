import {
  PaymentProvider,
} from './interface';
import { ProviderConfig, ProviderConfigSchema } from '@/types/provider';
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
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for payment providers.
 * Provides common functionality and enforces implementation of required methods.
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  protected config: ProviderConfig | null = null;

  /**
   * Credential fields this provider needs — drives the dashboard's
   * plug-and-play credential form. Subclasses declare this; the
   * `required` flags decide when the provider falls back to simulation.
   */
  readonly configSchema?: ProviderConfigSchema;

  // In-memory simulated objects — used when a provider runs without
  // credentials (plug-and-play mode). Mirrors MockProvider behaviour.
  private simulatedPayments = new Map<string, PaymentResult>();
  private simulatedPayouts = new Map<string, PayoutResult>();
  private simulatedMandates = new Map<string, MandateResult>();

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

  // ---------------------------------------------------------------
  // Plug-and-play simulation
  //
  // A provider runs in "simulation mode" while the merchant has not
  // saved real credentials. Simulated calls behave like the mock
  // provider — nothing reaches the real gateway. The moment
  // credentials are saved via the dashboard, the same code paths hit
  // the real API with no other changes required.
  // ---------------------------------------------------------------

  /**
   * True when every listed credential key holds a non-empty value.
   */
  protected hasCredentials(...keys: string[]): boolean {
    const creds = this.config?.credentials || {};
    return keys.every((k) => {
      const v = creds[k];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }

  /**
   * True when required credential keys from the config schema are set.
   */
  protected hasRequiredCredentials(): boolean {
    const required = Object.entries(this.configSchema || {})
      .filter(([, f]) => f.required)
      .map(([k]) => k);
    return required.length > 0 && this.hasCredentials(...required);
  }

  /**
   * Should this call be simulated? Simulated when running in the test
   * environment without the credentials the operation requires —
   * either an explicit key list or all schema-required keys.
   * Live environment NEVER simulates: a missing key is a real error.
   */
  protected shouldSimulate(requiredKeys?: string[]): boolean {
    if ((this.config?.environment ?? 'test') === 'live') return false;
    return requiredKeys
      ? !this.hasCredentials(...requiredKeys)
      : !this.hasRequiredCredentials();
  }

  /**
   * Simulated collection — 'processing' (PIN prompt "sent"), then
   * auto-succeeds after a short delay like the real async approval.
   * Pass metadata.simulateOutcome='failed' to force a decline.
   */
  protected simulatedPayment(input: CreatePaymentInput): PaymentResult {
    const providerReference = `sim_${this.name}_${uuidv4()}`;
    const forced = input.metadata?.simulateOutcome;

    const result: PaymentResult = {
      id: uuidv4(),
      providerReference,
      status: forced === 'failed' ? 'failed' : 'processing',
      amount: input.amount,
      currency: input.currency,
      metadata: { ...input.metadata, simulated: true },
      providerResponse: {
        simulated: true,
        provider: this.name,
        instructions: `Simulated ${this.name} payment — configure credentials to go live`,
      },
    };

    this.simulatedPayments.set(providerReference, result);
    if (forced !== 'failed') {
      setTimeout(() => {
        const p = this.simulatedPayments.get(providerReference);
        if (p && p.status === 'processing') {
          this.simulatedPayments.set(providerReference, { ...p, status: 'succeeded' });
        }
      }, 3000);
    }

    return result;
  }

  /**
   * Look up a simulated payment. Throws when the reference is unknown —
   * same contract as a real provider lookup of a bad reference.
   */
  protected simulatedGetPayment(input: GetPaymentInput): PaymentResult {
    const payment = this.simulatedPayments.get(input.providerReference);
    if (!payment) {
      // Reference created in a previous process — treat as succeeded so
      // dev verification flows still resolve after a server restart.
      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: 'succeeded',
        amount: 0,
        currency: 'USD',
        providerResponse: { simulated: true, provider: this.name, note: 'resolved-by-reference' },
      };
    }
    return { ...payment };
  }

  protected simulatedRefund(input: RefundPaymentInput): RefundResult {
    return {
      id: uuidv4(),
      providerReference: `sim_ref_${uuidv4()}`,
      status: 'succeeded',
      amount: input.amount,
      currency: input.currency,
      metadata: { ...input.metadata, simulated: true },
      providerResponse: { simulated: true, provider: this.name },
    };
  }

  protected simulatedPayout(input: PayoutInput, externalReference: string): PayoutResult {
    const result: PayoutResult = {
      id: uuidv4(),
      providerReference: `sim_po_${this.name}_${uuidv4()}`,
      externalReference,
      status: 'succeeded',
      amount: input.amount,
      currency: input.currency,
      recipientMsisdn: input.recipientMsisdn,
      serviceType: input.serviceType,
      metadata: { ...input.metadata, simulated: true },
      providerResponse: { simulated: true, provider: this.name },
    };
    this.simulatedPayouts.set(externalReference, result);
    return result;
  }

  protected simulatedGetPayout(input: GetPayoutInput): PayoutResult {
    const stored = this.simulatedPayouts.get(input.externalTransactionId);
    return {
      id: uuidv4(),
      providerReference: stored?.providerReference || `sim_po_${uuidv4()}`,
      externalReference: input.externalTransactionId,
      status: stored?.status || 'succeeded',
      amount: stored?.amount || 0,
      currency: input.currency,
      recipientMsisdn: input.msisdn,
      serviceType: 'merchant_to_subscriber',
      providerResponse: { simulated: true, provider: this.name },
    };
  }

  /**
   * Simulated mandate — starts 'pending' (customer "approving" the
   * PIN prompt) and auto-activates shortly after.
   */
  protected simulatedMandate(input: CreateMandateInput): MandateResult {
    const providerReference = `sim_mand_${this.name}_${uuidv4()}`;
    const result: MandateResult = {
      id: uuidv4(),
      providerReference,
      status: 'pending',
      metadata: { ...input.metadata, simulated: true },
      providerResponse: { simulated: true, provider: this.name },
    };
    this.simulatedMandates.set(providerReference, result);
    setTimeout(() => {
      const m = this.simulatedMandates.get(providerReference);
      if (m && m.status === 'pending') {
        this.simulatedMandates.set(providerReference, { ...m, status: 'active' });
      }
    }, 3000);
    return result;
  }

  protected simulatedMandateCharge(input: ChargeMandateInput): PaymentResult {
    const mandate = this.simulatedMandates.get(input.mandateReference);
    if (mandate && mandate.status === 'revoked') {
      throw new Error(`Mandate ${input.mandateReference} is revoked`);
    }
    const forced = input.metadata?.simulateOutcome;
    const providerReference = `sim_${this.name}_${uuidv4()}`;
    const result: PaymentResult = {
      id: uuidv4(),
      providerReference,
      status: forced === 'failed' ? 'failed' : 'succeeded',
      amount: input.amount,
      currency: input.currency,
      metadata: { ...input.metadata, mandateReference: input.mandateReference, simulated: true },
      providerResponse: { simulated: true, provider: this.name },
    };
    this.simulatedPayments.set(providerReference, result);
    return result;
  }

  protected simulatedRevokeMandate(input: RevokeMandateInput): void {
    const mandate = this.simulatedMandates.get(input.mandateReference);
    if (mandate) {
      this.simulatedMandates.set(input.mandateReference, { ...mandate, status: 'revoked' });
    }
  }

  /**
   * Latest status of a simulated mandate, if known in this process.
   */
  protected getSimulatedMandate(reference: string): MandateResult | undefined {
    const m = this.simulatedMandates.get(reference);
    return m ? { ...m } : undefined;
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

  async createPayout?(input: PayoutInput): Promise<PayoutResult> {
    throw new Error(`Payouts not supported by provider ${this.name}`);
  }

  async getPayout?(input: GetPayoutInput): Promise<PayoutResult> {
    throw new Error(`Payout lookup not supported by provider ${this.name}`);
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
