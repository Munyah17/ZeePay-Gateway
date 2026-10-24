import { BasePaymentProvider } from '../base';
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
  PaymentStatus,
} from '@/types/provider';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';

/**
 * ZimSwitch Online card provider.
 *
 * ZimSwitch Online (zimswitchonline.co.zw) is Zimbabwe's national-switch
 * e-commerce gateway. Through a single acquiring-bank relationship it
 * processes ZimSwitch domestic cards AND international Visa/Mastercard —
 * the realistic card rail for a Zimbabwe payment aggregator.
 *
 * API shape (ACI/OPE-style):
 *   POST /v1/checkouts            create a checkout → render the hosted
 *                                 COPYandPAY widget (lowest PCI scope)
 *   GET  /v1/checkouts/{id}/payment   verify outcome server-side
 *   POST /v1/payments             server-to-server DB/PA charges (PCI DSS
 *                                 required if card data is collected)
 *   POST /v1/payments/{id}        capture (CP) / refund (RF)
 *   POST /v1/checkouts + createRegistration=true   tokenise the card
 *   POST /v1/registrations/{id}/payments           recurring MIT debit
 *   DELETE /v1/registrations/{id}                  revoke a token
 *
 * Auth: Bearer access token + entityId on every request — both issued by
 * the acquiring bank during merchant onboarding.
 *
 * Credentials expected in ProviderConfig.credentials:
 *   entityId      — merchant entity ID (issued by acquiring bank)
 *   accessToken   — Bearer access token (issued by acquiring bank)
 *   baseUrl       — optional override; defaults to ZimSwitch sandbox/live
 */
export class ZimSwitchProvider extends BasePaymentProvider {
  private baseUrl!: string;
  private entityId!: string;
  private accessToken!: string;

  constructor() {
    super('zimswitch', 'card');
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      createPayment: true,
      getPayment: true,
      refundPayment: true,
      supportsWebhooks: true,
      // Tokenised registrations power recurring billing (MIT debits).
      supportsRecurring: true,
      createPayout: false,
    };
  }

  protected onInitialize(): void {
    if (!this.config) {
      throw new Error('ZimSwitch provider requires configuration');
    }

    const c = this.config.credentials;
    this.entityId = (c.entityId || '') as string;
    this.accessToken = (c.accessToken || c.apiKey || '') as string;
    this.baseUrl =
      (c.baseUrl as string) ||
      (this.config.environment === 'live'
        ? 'https://live.zimswitchonline.co.zw/'
        : 'https://test.zimswitchonline.co.zw/');
  }

  /**
   * Create a payment via the hosted-checkout flow (COPYandPAY).
   * Returns a checkout URL — the merchant renders the widget (or redirects
   * the shopper) there; card data never touches ZeePay's servers, keeping
   * PCI scope minimal (SAQ A).
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency || 'USD',
      paymentType: 'DB',
      merchantTransactionId: input.reference,
      shopperResultUrl: input.returnUrl || `${config.app.baseUrl}/checkout/complete`,
      ...(input.metadata?.paymentBrand ? { paymentBrand: input.metadata.paymentBrand } : {}),
      ...(input.metadata?.createRegistration ? { createRegistration: 'true' } : {}),
    });

    try {
      const response = await this.request('/v1/checkouts', params);

      const checkoutId = response.id;
      return {
        id: uuidv4(),
        providerReference: checkoutId,
        status: 'pending',
        // Hosted widget script URL — embed via <script> or redirect
        checkoutUrl: `${this.baseUrl}v1/paymentWidgets.js?checkoutId=${checkoutId}`,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch checkout creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a payment's outcome server-side after the shopper returns.
   * providerReference is the checkout ID from createPayment.
   */
  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();

    try {
      const response = await this.request(
        `/v1/checkouts/${input.providerReference}/payment?entityId=${encodeURIComponent(this.entityId)}`,
        undefined,
        'GET'
      );

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapResultCode(response.result?.code),
        amount: parseFloat(response.amount || '0'),
        currency: response.currency || 'USD',
        metadata: {
          paymentBrand: response.paymentBrand,
          registrationId: response.registrationId,
          resultDescription: response.result?.description,
        },
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund a settled payment — POST /v1/payments/{id} with paymentType=RF.
   * providerReference should be the payment ID returned by getPayment.
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundResult> {
    this.ensureInitialized();

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      paymentType: 'RF',
    });

    try {
      const response = await this.request(`/v1/payments/${input.paymentReference}`, params);

      return {
        id: uuidv4(),
        providerReference: response.id || input.paymentReference,
        status: this.isSuccessCode(response.result?.code) ? 'succeeded' : 'failed',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a card mandate — a checkout with createRegistration=true.
   * When the shopper completes the widget flow the card is tokenised as a
   * registrationId, which powers recurring merchant-initiated debits.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();

    const result = await this.createPayment({
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customerEmail: input.customerEmail,
      returnUrl: input.returnUrl,
      metadata: { ...input.metadata, createRegistration: true, interval: input.interval },
    });

    return {
      id: uuidv4(),
      providerReference: result.providerReference!,
      status: 'pending',
      approvalUrl: result.checkoutUrl,
      metadata: {
        ...input.metadata,
        note: 'Shopper completes the hosted widget; card is tokenised as a registrationId',
      },
    };
  }

  /**
   * Debit a tokenised card registration — merchant-initiated recurring charge.
   * mandateReference is the registrationId.
   */
  async chargeMandate(input: ChargeMandateInput): Promise<PaymentResult> {
    this.ensureInitialized();

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      paymentType: 'DB',
      recurringType: 'REPEATED',
      merchantTransactionId: input.reference,
    });

    try {
      const response = await this.request(`/v1/registrations/${input.mandateReference}/payments`, params);

      return {
        id: uuidv4(),
        providerReference: response.id || input.mandateReference,
        status: this.mapResultCode(response.result?.code),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch recurring charge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a card registration — revokes the mandate.
   */
  async revokeMandate(input: RevokeMandateInput): Promise<void> {
    this.ensureInitialized();

    await this.request(
      `/v1/registrations/${input.mandateReference}?entityId=${encodeURIComponent(this.entityId)}`,
      undefined,
      'DELETE'
    );
  }

  verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  parseWebhook(payload: string): {
    eventType: string;
    providerReference: string;
    data: Record<string, any>;
  } {
    try {
      const data = JSON.parse(payload);
      return {
        eventType: data.eventType || 'payment.updated',
        providerReference: data.id || data.registrationId,
        data,
      };
    } catch (error) {
      throw new Error('Invalid ZimSwitch webhook payload');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return true;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * OPE-style API request — form-encoded POST bodies, Bearer auth.
   */
  private async request(
    endpoint: string,
    params?: URLSearchParams,
    method: string = 'POST'
  ): Promise<any> {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const url = `${base.replace(/\/$/, '')}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
    };
    if (params && method === 'POST') {
      options.body = params.toString();
    }

    const response = await fetch(url, options);
    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`ZimSwitch API error: ${response.status} - ${text || response.statusText}`);
    }

    if (!response.ok) {
      const desc = data.result?.description || data.message || text || response.statusText;
      const err = new Error(`ZimSwitch API error: ${response.status} - ${desc}`) as Error & { code?: string };
      err.code = data.result?.code;
      throw err;
    }

    return data;
  }

  /**
   * OPE result-code families:
   *   000.0xx   success
   *   000.2xx   pending
   *   000.4xx   awaiting shopper action (3DS redirect etc.)
   *   others    declined / failed
   */
  private isSuccessCode(code?: string): boolean {
    return !!code && /^000\.0\d{2}/.test(code);
  }

  private mapResultCode(code?: string): PaymentStatus {
    if (!code) return 'pending';
    if (/^000\.0\d{2}/.test(code)) return 'succeeded';
    if (/^000\.2\d{2}/.test(code) || /^000\.4\d{2}/.test(code)) return 'processing';
    return 'failed';
  }
}
