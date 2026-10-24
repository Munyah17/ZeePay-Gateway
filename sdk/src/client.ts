import {
  CreatePaymentInput,
  Payment,
  CreateRefundInput,
  Refund,
  PaymentMethod,
  WebhookEndpoint,
  CreateWebhookInput,
  ListPaymentsOptions,
  ListPaymentsResponse,
  CreateSubscriptionInput,
  Subscription,
  ListSubscriptionsOptions,
  ListSubscriptionsResponse,
  ApiResponse,
} from './types';

export class ZeePayClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: { apiKey: string; apiUrl?: string }) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.zeepay.co.zw/v1';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    return this.request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get a payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${paymentId}`);
  }

  /**
   * List payments for the merchant
   */
  async listPayments(
    options?: ListPaymentsOptions
  ): Promise<ListPaymentsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;

    return this.request<ListPaymentsResponse>(endpoint);
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/payments/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel' }),
    });
  }

  /**
   * Create a refund
   */
  async createRefund(input: CreateRefundInput): Promise<Refund> {
    return this.request<Refund>('/refunds', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get a refund by ID
   */
  async getRefund(refundId: string): Promise<Refund> {
    return this.request<Refund>(`/refunds/${refundId}`);
  }

  /**
   * List available payment methods
   */
  async listPaymentMethods(): Promise<{ data: PaymentMethod[] }> {
    return this.request<{ data: PaymentMethod[] }>('/payment-methods');
  }

  /**
   * Create a webhook endpoint
   */
  async createWebhook(input: CreateWebhookInput): Promise<WebhookEndpoint & { secret: string }> {
    return this.request<WebhookEndpoint & { secret: string }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * List webhook endpoints
   */
  async listWebhooks(): Promise<{ data: WebhookEndpoint[] }> {
    return this.request<{ data: WebhookEndpoint[] }>('/webhooks');
  }

  /**
   * Get a webhook endpoint by ID
   */
  async getWebhook(webhookId: string): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(`/webhooks/${webhookId}`);
  }

  /**
   * Update a webhook endpoint
   */
  async updateWebhook(
    webhookId: string,
    updates: {
      url?: string;
      events?: string[];
      isActive?: boolean;
      rotateSecret?: boolean;
    }
  ): Promise<WebhookEndpoint & { secret?: string }> {
    return this.request<WebhookEndpoint & { secret?: string }>(`/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a webhook endpoint
   */
  async deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookDeliveries(
    webhookId: string,
    limit?: number
  ): Promise<{ data: any[] }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const endpoint = `/webhooks/${webhookId}/deliveries${queryString ? `?${queryString}` : ''}`;

    return this.request<{ data: any[] }>(endpoint);
  }

  /**
   * Create a subscription with auto-deduct.
   * For mobile money the customer approves the mandate once;
   * afterwards ZeePay debits automatically on each billing date.
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.request<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * List subscriptions for the merchant
   */
  async listSubscriptions(
    options?: ListSubscriptionsOptions
  ): Promise<ListSubscriptionsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);

    const queryString = params.toString();
    const endpoint = `/subscriptions${queryString ? `?${queryString}` : ''}`;

    return this.request<ListSubscriptionsResponse>(endpoint);
  }

  /**
   * Pause an active subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'pause' }),
    });
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'resume' }),
    });
  }

  /**
   * Cancel a subscription and revoke its mandate
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel', reason }),
    });
  }
}

/**
 * Payments resource
 */
export class Payments {
  constructor(private client: ZeePayClient) {}

  async create(input: CreatePaymentInput): Promise<Payment> {
    return this.client.createPayment(input);
  }

  async get(paymentId: string): Promise<Payment> {
    return this.client.getPayment(paymentId);
  }

  async list(options?: ListPaymentsOptions): Promise<ListPaymentsResponse> {
    return this.client.listPayments(options);
  }

  async cancel(paymentId: string): Promise<Payment> {
    return this.client.cancelPayment(paymentId);
  }
}

/**
 * Refunds resource
 */
export class Refunds {
  constructor(private client: ZeePayClient) {}

  async create(input: CreateRefundInput): Promise<Refund> {
    return this.client.createRefund(input);
  }

  async get(refundId: string): Promise<Refund> {
    return this.client.getRefund(refundId);
  }
}

/**
 * Webhooks resource
 */
export class Webhooks {
  constructor(private client: ZeePayClient) {}

  async create(input: CreateWebhookInput): Promise<WebhookEndpoint & { secret: string }> {
    return this.client.createWebhook(input);
  }

  async list(): Promise<{ data: WebhookEndpoint[] }> {
    return this.client.listWebhooks();
  }

  async get(webhookId: string): Promise<WebhookEndpoint> {
    return this.client.getWebhook(webhookId);
  }

  async update(
    webhookId: string,
    updates: {
      url?: string;
      events?: string[];
      isActive?: boolean;
      rotateSecret?: boolean;
    }
  ): Promise<WebhookEndpoint & { secret?: string }> {
    return this.client.updateWebhook(webhookId, updates);
  }

  async delete(webhookId: string): Promise<{ success: boolean }> {
    return this.client.deleteWebhook(webhookId);
  }

  async getDeliveries(webhookId: string, limit?: number): Promise<{ data: any[] }> {
    return this.client.getWebhookDeliveries(webhookId, limit);
  }
}

/**
 * Subscriptions resource — recurring billing with auto-deduct
 */
export class Subscriptions {
  constructor(private client: ZeePayClient) {}

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.client.createSubscription(input);
  }

  async get(subscriptionId: string): Promise<Subscription> {
    return this.client.getSubscription(subscriptionId);
  }

  async list(options?: ListSubscriptionsOptions): Promise<ListSubscriptionsResponse> {
    return this.client.listSubscriptions(options);
  }

  async pause(subscriptionId: string): Promise<Subscription> {
    return this.client.pauseSubscription(subscriptionId);
  }

  async resume(subscriptionId: string): Promise<Subscription> {
    return this.client.resumeSubscription(subscriptionId);
  }

  async cancel(subscriptionId: string, reason?: string): Promise<Subscription> {
    return this.client.cancelSubscription(subscriptionId, reason);
  }
}
