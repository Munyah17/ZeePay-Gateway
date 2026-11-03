"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Products = exports.Payouts = exports.Subscriptions = exports.Webhooks = exports.Refunds = exports.Payments = exports.ZeePayClient = void 0;
class ZeePayClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl || 'https://api.zeepay.co.zw/v1';
    }
    async request(endpoint, options = {}) {
        const url = `${this.apiUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            ...options.headers,
        };
        const response = await fetch(url, {
            ...options,
            headers,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Request failed');
        }
        return data;
    }
    /**
     * Create a new payment
     */
    async createPayment(input) {
        return this.request('/payments', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Get a payment by ID
     */
    async getPayment(paymentId) {
        return this.request(`/payments/${paymentId}`);
    }
    /**
     * List payments for the merchant
     */
    async listPayments(options) {
        const params = new URLSearchParams();
        if (options?.limit)
            params.append('limit', options.limit.toString());
        if (options?.offset)
            params.append('offset', options.offset.toString());
        if (options?.status)
            params.append('status', options.status);
        const queryString = params.toString();
        const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Cancel a payment
     */
    async cancelPayment(paymentId) {
        return this.request(`/payments/${paymentId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'cancel' }),
        });
    }
    /**
     * Create a refund
     */
    async createRefund(input) {
        return this.request('/refunds', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Get a refund by ID
     */
    async getRefund(refundId) {
        return this.request(`/refunds/${refundId}`);
    }
    /**
     * List available payment methods
     */
    async listPaymentMethods() {
        return this.request('/payment-methods');
    }
    /**
     * Create a webhook endpoint
     */
    async createWebhook(input) {
        return this.request('/webhooks', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * List webhook endpoints
     */
    async listWebhooks() {
        return this.request('/webhooks');
    }
    /**
     * Get a webhook endpoint by ID
     */
    async getWebhook(webhookId) {
        return this.request(`/webhooks/${webhookId}`);
    }
    /**
     * Update a webhook endpoint
     */
    async updateWebhook(webhookId, updates) {
        return this.request(`/webhooks/${webhookId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Delete a webhook endpoint
     */
    async deleteWebhook(webhookId) {
        return this.request(`/webhooks/${webhookId}`, {
            method: 'DELETE',
        });
    }
    /**
     * Get webhook delivery history
     */
    async getWebhookDeliveries(webhookId, limit) {
        const params = new URLSearchParams();
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const endpoint = `/webhooks/${webhookId}/deliveries${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Create a subscription with auto-deduct.
     * For mobile money the customer approves the mandate once;
     * afterwards ZeePay debits automatically on each billing date.
     */
    async createSubscription(input) {
        return this.request('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Get a subscription by ID
     */
    async getSubscription(subscriptionId) {
        return this.request(`/subscriptions/${subscriptionId}`);
    }
    /**
     * List subscriptions for the merchant
     */
    async listSubscriptions(options) {
        const params = new URLSearchParams();
        if (options?.limit)
            params.append('limit', options.limit.toString());
        if (options?.offset)
            params.append('offset', options.offset.toString());
        if (options?.status)
            params.append('status', options.status);
        const queryString = params.toString();
        const endpoint = `/subscriptions${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Pause an active subscription
     */
    async pauseSubscription(subscriptionId) {
        return this.request(`/subscriptions/${subscriptionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'pause' }),
        });
    }
    /**
     * Resume a paused subscription
     */
    async resumeSubscription(subscriptionId) {
        return this.request(`/subscriptions/${subscriptionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'resume' }),
        });
    }
    /**
     * Cancel a subscription and revoke its mandate
     */
    async cancelSubscription(subscriptionId, reason) {
        return this.request(`/subscriptions/${subscriptionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'cancel', reason }),
        });
    }
    /**
     * Create a payout — disburse funds into a customer's wallet.
     * serviceType: enterprise_cash_in | change_disbursement | merchant_to_subscriber.
     * externalReference is the idempotency key.
     */
    async createPayout(input) {
        return this.request('/payouts', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Look up a payout by its externalReference
     */
    async getPayout(externalReference) {
        return this.request(`/payouts/${externalReference}`);
    }
    /**
     * List payouts for the merchant
     */
    async listPayouts(options) {
        const params = new URLSearchParams();
        if (options?.limit)
            params.append('limit', options.limit.toString());
        if (options?.offset)
            params.append('offset', options.offset.toString());
        if (options?.status)
            params.append('status', options.status);
        if (options?.serviceType)
            params.append('serviceType', options.serviceType);
        const queryString = params.toString();
        const endpoint = `/payouts${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Create a catalogue product. ZeePay is the back store — your
     * storefront lists what this returns. Re-sending the same
     * externalReference (SKU) returns the existing product.
     */
    async createProduct(input) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }
    /**
     * Get a product by ID
     */
    async getProduct(productId) {
        return this.request(`/products/${productId}`);
    }
    /**
     * List catalogue products — the "pull" endpoint a storefront
     * calls to render its shop. Pass activeOnly: true to show only
     * sellable items.
     */
    async listProducts(options) {
        const params = new URLSearchParams();
        if (options?.limit)
            params.append('limit', options.limit.toString());
        if (options?.offset)
            params.append('offset', options.offset.toString());
        if (options?.activeOnly)
            params.append('activeOnly', 'true');
        if (options?.search)
            params.append('search', options.search);
        if (options?.category)
            params.append('category', options.category);
        const queryString = params.toString();
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }
    /**
     * Update a product — price, stock, images, availability
     */
    async updateProduct(productId, updates) {
        return this.request(`/products/${productId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }
    /**
     * Deactivate a product — removes it from storefront listings but
     * keeps the record and payment history.
     */
    async deleteProduct(productId) {
        return this.request(`/products/${productId}`, {
            method: 'DELETE',
        });
    }
}
exports.ZeePayClient = ZeePayClient;
/**
 * Payments resource
 */
class Payments {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createPayment(input);
    }
    async get(paymentId) {
        return this.client.getPayment(paymentId);
    }
    async list(options) {
        return this.client.listPayments(options);
    }
    async cancel(paymentId) {
        return this.client.cancelPayment(paymentId);
    }
}
exports.Payments = Payments;
/**
 * Refunds resource
 */
class Refunds {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createRefund(input);
    }
    async get(refundId) {
        return this.client.getRefund(refundId);
    }
}
exports.Refunds = Refunds;
/**
 * Webhooks resource
 */
class Webhooks {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createWebhook(input);
    }
    async list() {
        return this.client.listWebhooks();
    }
    async get(webhookId) {
        return this.client.getWebhook(webhookId);
    }
    async update(webhookId, updates) {
        return this.client.updateWebhook(webhookId, updates);
    }
    async delete(webhookId) {
        return this.client.deleteWebhook(webhookId);
    }
    async getDeliveries(webhookId, limit) {
        return this.client.getWebhookDeliveries(webhookId, limit);
    }
}
exports.Webhooks = Webhooks;
/**
 * Subscriptions resource — recurring billing with auto-deduct
 */
class Subscriptions {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createSubscription(input);
    }
    async get(subscriptionId) {
        return this.client.getSubscription(subscriptionId);
    }
    async list(options) {
        return this.client.listSubscriptions(options);
    }
    async pause(subscriptionId) {
        return this.client.pauseSubscription(subscriptionId);
    }
    async resume(subscriptionId) {
        return this.client.resumeSubscription(subscriptionId);
    }
    async cancel(subscriptionId, reason) {
        return this.client.cancelSubscription(subscriptionId, reason);
    }
}
exports.Subscriptions = Subscriptions;
/**
 * Payouts resource — disbursements to customer wallets
 */
class Payouts {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createPayout(input);
    }
    async get(externalReference) {
        return this.client.getPayout(externalReference);
    }
    async list(options) {
        return this.client.listPayouts(options);
    }
}
exports.Payouts = Payouts;
/**
 * Products resource — merchant catalogue (back store). A storefront
 * pulls the catalogue with list(), then sells items by creating a
 * payment with { productId } — the price is resolved server-side.
 */
class Products {
    constructor(client) {
        this.client = client;
    }
    async create(input) {
        return this.client.createProduct(input);
    }
    async get(productId) {
        return this.client.getProduct(productId);
    }
    async list(options) {
        return this.client.listProducts(options);
    }
    async update(productId, updates) {
        return this.client.updateProduct(productId, updates);
    }
    async delete(productId) {
        return this.client.deleteProduct(productId);
    }
}
exports.Products = Products;
