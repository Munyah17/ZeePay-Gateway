import { ZeePayClient, Payments, Refunds, Webhooks, Subscriptions } from './client';
export { ZeePayClient, Payments, Refunds, Webhooks, Subscriptions };
export * from './types';

/**
 * Create a new ZeePay instance
 * @param config - Configuration object with API key
 * @returns ZeePay client instance
 *
 * @example
 * ```typescript
 * import ZeePay from 'zeepay-sdk';
 *
 * const zeePay = new ZeePay({
 *   apiKey: 'zp_test_your_api_key_here'
 * });
 *
 * const payment = await zeePay.payments.create({
 *   amount: 10,
 *   currency: 'USD',
 *   reference: 'invoice_1042'
 * });
 *
 * console.log(payment.checkoutUrl);
 * ```
 */
export default class ZeePay {
  public readonly payments: Payments;
  public readonly refunds: Refunds;
  public readonly webhooks: Webhooks;
  public readonly subscriptions: Subscriptions;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    const client = new ZeePayClient(config);
    this.payments = new Payments(client);
    this.refunds = new Refunds(client);
    this.webhooks = new Webhooks(client);
    this.subscriptions = new Subscriptions(client);
  }
}
