import { CreatePaymentInput, Payment, CreateRefundInput, Refund, PaymentMethod, WebhookEndpoint, CreateWebhookInput, ListPaymentsOptions, ListPaymentsResponse, CreateSubscriptionInput, Subscription, ListSubscriptionsOptions, ListSubscriptionsResponse, CreatePayoutInput, Payout, ListPayoutsOptions, ListPayoutsResponse, CreateProductInput, UpdateProductInput, Product, ListProductsOptions, ListProductsResponse } from './types';
export declare class ZeePayClient {
    private apiKey;
    private apiUrl;
    constructor(config: {
        apiKey: string;
        apiUrl?: string;
    });
    private request;
    /**
     * Create a new payment
     */
    createPayment(input: CreatePaymentInput): Promise<Payment>;
    /**
     * Get a payment by ID
     */
    getPayment(paymentId: string): Promise<Payment>;
    /**
     * List payments for the merchant
     */
    listPayments(options?: ListPaymentsOptions): Promise<ListPaymentsResponse>;
    /**
     * Cancel a payment
     */
    cancelPayment(paymentId: string): Promise<Payment>;
    /**
     * Create a refund
     */
    createRefund(input: CreateRefundInput): Promise<Refund>;
    /**
     * Get a refund by ID
     */
    getRefund(refundId: string): Promise<Refund>;
    /**
     * List available payment methods
     */
    listPaymentMethods(): Promise<{
        data: PaymentMethod[];
    }>;
    /**
     * Create a webhook endpoint
     */
    createWebhook(input: CreateWebhookInput): Promise<WebhookEndpoint & {
        secret: string;
    }>;
    /**
     * List webhook endpoints
     */
    listWebhooks(): Promise<{
        data: WebhookEndpoint[];
    }>;
    /**
     * Get a webhook endpoint by ID
     */
    getWebhook(webhookId: string): Promise<WebhookEndpoint>;
    /**
     * Update a webhook endpoint
     */
    updateWebhook(webhookId: string, updates: {
        url?: string;
        events?: string[];
        isActive?: boolean;
        rotateSecret?: boolean;
    }): Promise<WebhookEndpoint & {
        secret?: string;
    }>;
    /**
     * Delete a webhook endpoint
     */
    deleteWebhook(webhookId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get webhook delivery history
     */
    getWebhookDeliveries(webhookId: string, limit?: number): Promise<{
        data: any[];
    }>;
    /**
     * Create a subscription with auto-deduct.
     * For mobile money the customer approves the mandate once;
     * afterwards ZeePay debits automatically on each billing date.
     */
    createSubscription(input: CreateSubscriptionInput): Promise<Subscription>;
    /**
     * Get a subscription by ID
     */
    getSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * List subscriptions for the merchant
     */
    listSubscriptions(options?: ListSubscriptionsOptions): Promise<ListSubscriptionsResponse>;
    /**
     * Pause an active subscription
     */
    pauseSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * Resume a paused subscription
     */
    resumeSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * Cancel a subscription and revoke its mandate
     */
    cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription>;
    /**
     * Create a payout — disburse funds into a customer's wallet.
     * serviceType: enterprise_cash_in | change_disbursement | merchant_to_subscriber.
     * externalReference is the idempotency key.
     */
    createPayout(input: CreatePayoutInput): Promise<Payout>;
    /**
     * Look up a payout by its externalReference
     */
    getPayout(externalReference: string): Promise<Payout>;
    /**
     * List payouts for the merchant
     */
    listPayouts(options?: ListPayoutsOptions): Promise<ListPayoutsResponse>;
    /**
     * Create a catalogue product. ZeePay is the back store — your
     * storefront lists what this returns. Re-sending the same
     * externalReference (SKU) returns the existing product.
     */
    createProduct(input: CreateProductInput): Promise<Product>;
    /**
     * Get a product by ID
     */
    getProduct(productId: string): Promise<Product>;
    /**
     * List catalogue products — the "pull" endpoint a storefront
     * calls to render its shop. Pass activeOnly: true to show only
     * sellable items.
     */
    listProducts(options?: ListProductsOptions): Promise<ListProductsResponse>;
    /**
     * Update a product — price, stock, images, availability
     */
    updateProduct(productId: string, updates: UpdateProductInput): Promise<Product>;
    /**
     * Deactivate a product — removes it from storefront listings but
     * keeps the record and payment history.
     */
    deleteProduct(productId: string): Promise<Product>;
}
/**
 * Payments resource
 */
export declare class Payments {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreatePaymentInput): Promise<Payment>;
    get(paymentId: string): Promise<Payment>;
    list(options?: ListPaymentsOptions): Promise<ListPaymentsResponse>;
    cancel(paymentId: string): Promise<Payment>;
}
/**
 * Refunds resource
 */
export declare class Refunds {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreateRefundInput): Promise<Refund>;
    get(refundId: string): Promise<Refund>;
}
/**
 * Webhooks resource
 */
export declare class Webhooks {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreateWebhookInput): Promise<WebhookEndpoint & {
        secret: string;
    }>;
    list(): Promise<{
        data: WebhookEndpoint[];
    }>;
    get(webhookId: string): Promise<WebhookEndpoint>;
    update(webhookId: string, updates: {
        url?: string;
        events?: string[];
        isActive?: boolean;
        rotateSecret?: boolean;
    }): Promise<WebhookEndpoint & {
        secret?: string;
    }>;
    delete(webhookId: string): Promise<{
        success: boolean;
    }>;
    getDeliveries(webhookId: string, limit?: number): Promise<{
        data: any[];
    }>;
}
/**
 * Subscriptions resource — recurring billing with auto-deduct
 */
export declare class Subscriptions {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreateSubscriptionInput): Promise<Subscription>;
    get(subscriptionId: string): Promise<Subscription>;
    list(options?: ListSubscriptionsOptions): Promise<ListSubscriptionsResponse>;
    pause(subscriptionId: string): Promise<Subscription>;
    resume(subscriptionId: string): Promise<Subscription>;
    cancel(subscriptionId: string, reason?: string): Promise<Subscription>;
}
/**
 * Payouts resource — disbursements to customer wallets
 */
export declare class Payouts {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreatePayoutInput): Promise<Payout>;
    get(externalReference: string): Promise<Payout>;
    list(options?: ListPayoutsOptions): Promise<ListPayoutsResponse>;
}
/**
 * Products resource — merchant catalogue (back store). A storefront
 * pulls the catalogue with list(), then sells items by creating a
 * payment with { productId } — the price is resolved server-side.
 */
export declare class Products {
    private client;
    constructor(client: ZeePayClient);
    create(input: CreateProductInput): Promise<Product>;
    get(productId: string): Promise<Product>;
    list(options?: ListProductsOptions): Promise<ListProductsResponse>;
    update(productId: string, updates: UpdateProductInput): Promise<Product>;
    delete(productId: string): Promise<Product>;
}
