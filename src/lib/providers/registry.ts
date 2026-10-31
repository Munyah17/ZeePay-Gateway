import { PaymentProvider } from './interface';
import { MockProvider } from './mock/mock-provider';
import { EcoCashProvider } from './ecocash/ecocash-provider';
import { InnBucksProvider } from './innbucks/innbucks-provider';
import { OmariProvider } from './omari/omari-provider';
import { OneMoneyProvider } from './onemoney/onemoney-provider';
import { MtnMomoProvider } from './mtn-momo/mtn-momo-provider';
import { MpesaProvider } from './mpesa/mpesa-provider';
import { OPayProvider } from './opay/opay-provider';
import { PalmPayProvider } from './palmpay/palmpay-provider';
import { ZelleProvider } from './zelle/zelle-provider';
import { CashAppProvider } from './cashapp/cashapp-provider';
import { VisaProvider } from './cards/visa-provider';
import { MastercardProvider } from './cards/mastercard-provider';
import { ZimSwitchProvider } from './cards/zimswitch-provider';

/**
 * Registry for managing payment providers.
 * Allows dynamic registration and retrieval of providers.
 */
export class PaymentProviderRegistry {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    // Register mock provider for testing
    this.register(new MockProvider());

    // Zimbabwean payment providers
    this.register(new EcoCashProvider());
    this.register(new InnBucksProvider());
    this.register(new OmariProvider());
    this.register(new OneMoneyProvider());

    // Regional & international mobile money / wallet providers
    this.register(new MtnMomoProvider());
    this.register(new MpesaProvider());
    this.register(new OPayProvider());
    this.register(new PalmPayProvider());
    this.register(new ZelleProvider());
    this.register(new CashAppProvider());

    // Card providers
    this.register(new VisaProvider());
    this.register(new MastercardProvider());
    this.register(new ZimSwitchProvider());
  }

  /**
   * Register a payment provider
   */
  register(provider: PaymentProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  /**
   * Get a payment provider by name
   */
  get(name: string): PaymentProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * Get all registered providers
   */
  getAll(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Remove a provider from the registry
   */
  unregister(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }

  /**
   * Get providers by type
   */
  getByType(type: string): PaymentProvider[] {
    return this.getAll().filter((p) => p.type === type);
  }
}

// Singleton instance
export const providerRegistry = new PaymentProviderRegistry();
