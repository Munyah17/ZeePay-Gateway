import { SmsProvider } from './interface';
import { HttpSmsProvider } from './http/http-sms-provider';
import { SmppProvider } from './smpp/smpp-provider';

/**
 * Registry for SMS gateway providers.
 * Separate from PaymentProviderRegistry — messaging and payments are
 * distinct domains that may use the same gateway credentials differently.
 */
export class SmsProviderRegistry {
  private providers: Map<string, SmsProvider> = new Map();

  constructor() {
    this.register(new HttpSmsProvider());
    this.register(new SmppProvider());
  }

  register(provider: SmsProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): SmsProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAll(): SmsProvider[] {
    return Array.from(this.providers.values());
  }

  has(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  unregister(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }
}

// Singleton instance
export const smsProviderRegistry = new SmsProviderRegistry();
