import { ZeePayClient, Payments, Refunds, Webhooks, Subscriptions, Payouts, Products } from './client';
export { ZeePayClient, Payments, Refunds, Webhooks, Subscriptions, Payouts, Products };
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
    readonly payments: Payments;
    readonly refunds: Refunds;
    readonly webhooks: Webhooks;
    readonly subscriptions: Subscriptions;
    readonly payouts: Payouts;
    readonly products: Products;
    constructor(config: {
        apiKey: string;
        apiUrl?: string;
    });
}
