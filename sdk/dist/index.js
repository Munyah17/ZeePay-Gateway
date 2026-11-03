"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Products = exports.Payouts = exports.Subscriptions = exports.Webhooks = exports.Refunds = exports.Payments = exports.ZeePayClient = void 0;
const client_1 = require("./client");
Object.defineProperty(exports, "ZeePayClient", { enumerable: true, get: function () { return client_1.ZeePayClient; } });
Object.defineProperty(exports, "Payments", { enumerable: true, get: function () { return client_1.Payments; } });
Object.defineProperty(exports, "Refunds", { enumerable: true, get: function () { return client_1.Refunds; } });
Object.defineProperty(exports, "Webhooks", { enumerable: true, get: function () { return client_1.Webhooks; } });
Object.defineProperty(exports, "Subscriptions", { enumerable: true, get: function () { return client_1.Subscriptions; } });
Object.defineProperty(exports, "Payouts", { enumerable: true, get: function () { return client_1.Payouts; } });
Object.defineProperty(exports, "Products", { enumerable: true, get: function () { return client_1.Products; } });
__exportStar(require("./types"), exports);
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
class ZeePay {
    constructor(config) {
        const client = new client_1.ZeePayClient(config);
        this.payments = new client_1.Payments(client);
        this.refunds = new client_1.Refunds(client);
        this.webhooks = new client_1.Webhooks(client);
        this.subscriptions = new client_1.Subscriptions(client);
        this.payouts = new client_1.Payouts(client);
        this.products = new client_1.Products(client);
    }
}
exports.default = ZeePay;
