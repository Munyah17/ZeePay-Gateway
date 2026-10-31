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
  CreatePaymentLinkInput,
  PaymentLinkResult,
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
 *
 * SECURITY REQUIREMENTS:
 *
 * COPYandPAY (hosted checkout, SAQ-A compliance):
 *   - Never expose bearer tokens or entity ID in frontend JavaScript
 *   - Prepare checkout and verify status on server-side only
 *   - Never store or log full PAN, CVV, or PIN on your systems
 *   - Use HTTPS for all checkout and callback URLs
 *   - Always verify payment status server-side; redirect alone is not proof of payment
 *   - Mask card references in logs; store only gateway transaction IDs
 *   - Checkout IDs expire after 30 minutes or after successful payment
 *
 * Server-to-Server (direct card handling, PCI DSS required):
 *   - PCI DSS compliance is MANDATORY if collecting, processing or transmitting card data
 *   - Use COPYandPAY instead to minimise PCI scope
 *   - Never log or persist full PAN, CVV or magnetic-stripe data
 *   - Use TLS 1.2+ for all API communication
 *   - Restrict access tokens to backend services with secrets management
 *   - Validate amount, currency and merchant transaction ID on every status response
 *   - Implement idempotent fulfilment to handle duplicate callbacks or retries
 */
export class ZimSwitchProvider extends BasePaymentProvider {
  private static readonly REQUIRED_KEYS = ['entityId', 'accessToken'];

  readonly configSchema = {
    entityId: { label: 'Entity ID (issued by acquiring bank)', required: true },
    accessToken: { label: 'Bearer access token', required: true, secret: true },
    baseUrl: { label: 'Base URL override (optional)', required: false },
  };

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
      // Pay by Link requires separate enablement from acquiring bank
      createPaymentLink: true,
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
   * Create a payment via COPYandPAY (hosted checkout) or server-to-server.
   *
   * COPYandPAY flow (default, SAQ-A compliance):
   *   - No card data in request
   *   - Returns checkout URL for hosted widget
   *   - Card data never touches ZeePay servers
   *
   * Server-to-server flow (PCI DSS required):
   *   - Requires cardData in input
   *   - Direct POST to /v1/payments with card details
   *   - Supports DB (debit), PA (pre-auth) payment types
   *   - May return redirect parameters for async flows
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return this.simulatedPayment(input);
    }

    // Server-to-server flow with card data (PCI DSS compliance required)
    if (input.cardData) {
      return this.createServerToServerPayment(input);
    }

    // COPYandPAY hosted checkout flow (default, SAQ-A compliance)
    return this.createCheckoutPayment(input);
  }

  /**
   * COPYandPAY hosted checkout flow — lowest PCI scope (SAQ-A).
   * Card data is entered on gateway-hosted widget.
   */
  private async createCheckoutPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const isTest = this.config?.environment === 'test';

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency || 'USD',
      paymentType: 'DB',
      merchantTransactionId: input.reference,
      // testMode: 'EXTERNAL' for UAT sandbox, omit for production
      ...(isTest ? { testMode: 'EXTERNAL' } : {}),
      ...(input.metadata?.paymentBrand ? { paymentBrand: input.metadata.paymentBrand } : {}),
      // Shopper identity — links registrations/charges to the merchant's customer
      ...(input.customerEmail ? { 'customer.email': input.customerEmail } : {}),
      ...(input.metadata?.customerReference ? { merchantCustomerId: input.metadata.customerReference } : {}),
      ...(input.metadata?.createRegistration ? { createRegistration: 'true' } : {}),
      // shopperResultUrl is set on the paymentWidgets form (recommended pattern)
      // but can be sent here as fallback if needed via metadata
      ...(input.metadata?.shopperResultUrl ? { shopperResultUrl: input.metadata.shopperResultUrl } : {}),
    });

    try {
      const response = await this.request('/v1/checkouts', params);

      if (!response) {
        throw new Error('ZimSwitch API returned invalid response: null response');
      }

      const checkoutId = response.id as string | undefined;
      if (!checkoutId) {
        throw new Error('ZimSwitch API returned invalid response: missing checkout ID');
      }

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
   * Server-to-server payment flow — PCI DSS compliance required.
   * Direct POST to /v1/payments with card details.
   * Supports DB (debit), PA (pre-auth) payment types.
   * May return redirect parameters for async flows (3DS, issuer validation).
   */
  private async createServerToServerPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const isTest = this.config?.environment === 'test';
    const paymentType = input.paymentType || 'DB';
    // paymentBrand is REQUIRED for S2S — metadata override wins,
    // otherwise detect from the card BIN.
    const paymentBrand =
      (input.metadata?.paymentBrand as string | undefined) ||
      (input.cardData ? this.detectCardBrand(input.cardData.number) : undefined);

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency || 'USD',
      paymentType,
      merchantTransactionId: input.reference,
      ...(isTest ? { testMode: 'EXTERNAL' } : {}),
      ...(paymentBrand ? { paymentBrand } : {}),
      // shopperResultUrl required for async flows
      ...(input.returnUrl ? { shopperResultUrl: input.returnUrl } : {}),
    });

    // Add card data (PCI DSS compliance required)
    if (input.cardData) {
      params.append('card.number', input.cardData.number);
      params.append('card.holder', input.cardData.holder);
      params.append('card.expiryMonth', input.cardData.expiryMonth);
      params.append('card.expiryYear', input.cardData.expiryYear);
      params.append('card.cvv', input.cardData.cvv);
    }

    try {
      const response = await this.request('/v1/payments', params);

      if (!response) {
        throw new Error('ZimSwitch API returned invalid response: null response');
      }

      const paymentId = response.id as string | undefined;
      if (!paymentId) {
        throw new Error('ZimSwitch API returned invalid response: missing payment ID');
      }

      // Check for async redirect (3DS, issuer validation) — the
      // browser must submit the gateway-supplied parameters, not just
      // navigate to the URL.
      if (response.redirect) {
        return {
          id: uuidv4(),
          providerReference: paymentId,
          status: 'processing',
          checkoutUrl: response.redirect.url,
          redirect: this.parseRedirect(response.redirect),
          amount: input.amount,
          currency: input.currency,
          metadata: input.metadata,
          providerResponse: response,
        };
      }

      // Synchronous response
      return {
        id: uuidv4(),
        providerReference: paymentId,
        status: this.mapResultCode(response.result?.code),
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch server-to-server payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a payment's outcome server-side after the shopper returns.
   * providerReference is the checkout ID from createPayment.
   */
  async getPayment(input: GetPaymentInput): Promise<PaymentResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return this.simulatedGetPayment(input);
    }

    try {
      let response;
      if (input.resourcePath) {
        // Gateway-supplied verify path from the shopper redirect —
        // query it verbatim (pay-by-link uses paybylink/v1/{id}/checkouts/{id}/payment).
        const path = input.resourcePath.startsWith('/') ? input.resourcePath : `/${input.resourcePath}`;
        response = await this.request(
          `${path}?entityId=${encodeURIComponent(this.entityId)}`,
          undefined,
          'GET'
        );
      } else {
        try {
          // S2S references are payment IDs → /v1/payments/{id}
          response = await this.request(
            `/v1/payments/${input.providerReference}?entityId=${encodeURIComponent(this.entityId)}`,
            undefined,
            'GET'
          );
        } catch {
          // Hosted-checkout references are checkout IDs → /v1/checkouts/{id}/payment
          response = await this.request(
            `/v1/checkouts/${input.providerReference}/payment?entityId=${encodeURIComponent(this.entityId)}`,
            undefined,
            'GET'
          );
        }
      }

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
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return this.simulatedRefund(input);
    }

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
   * Capture a pre-authorised payment — POST /v1/payments/{id} with paymentType=CP.
   * Used after PA (pre-authorisation) to settle reserved funds.
   * paymentReference should be the payment ID from the original PA transaction.
   */
  async capturePayment(paymentReference: string, amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentResult> {
    this.ensureInitialized();

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: amount.toFixed(2),
      currency,
      paymentType: 'CP',
    });

    try {
      const response = await this.request(`/v1/payments/${paymentReference}`, params);

      return {
        id: uuidv4(),
        providerReference: response.id || paymentReference,
        status: this.isSuccessCode(response.result?.code) ? 'succeeded' : 'failed',
        amount,
        currency,
        metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a Pay by Link — shareable payment link for invoices, campaigns, events.
   * Requires separate enablement from acquiring bank.
   * Customer pays on a branded hosted page; merchant verifies status before fulfilment.
   */
  async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLinkResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      const linkId = `sim_link_${uuidv4()}`;
      return {
        id: uuidv4(),
        providerReference: linkId,
        linkUrl: `https://test.zimswitchonline.co.zw/v1/paymentLinks/${linkId}`,
        status: 'active',
        amount: input.amount,
        currency: input.currency || 'USD',
        reference: input.reference,
        expiryDate: input.expiryDate,
        metadata: { ...input.metadata, simulated: true },
        providerResponse: { simulated: true, provider: this.name },
      };
    }

    const isTest = this.config?.environment === 'test';

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency || 'USD',
      paymentType: 'DB',
      merchantTransactionId: input.reference,
      ...(isTest ? { testMode: 'EXTERNAL' } : {}),
      // Required so the customer returns to the merchant after paying —
      // the redirect carries id + checkoutId + resourcePath to verify.
      ...(input.shopperResultUrl ? { shopperResultUrl: input.shopperResultUrl } : {}),
      // OPE link validity: validUntil + validUntilUnit (HOUR|DAY),
      // defaults to 90 days on the gateway when omitted.
      ...(input.validUntil != null ? { validUntil: String(input.validUntil) } : {}),
      ...(input.validUntilUnit ? { validUntilUnit: input.validUntilUnit } : {}),
      ...(input.expiryDate ? { expiryDate: input.expiryDate } : {}),
      ...(input.createQRCode ? { createQRCode: 'true' } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.customerEmail ? { customerEmail: input.customerEmail } : {}),
      ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
    });

    try {
      // Pay by Link uses checkout endpoint with link-specific parameters
      const response = await this.request('/v1/checkouts', params);

      const checkoutId = response.id as string | undefined;
      if (!checkoutId) {
        throw new Error('ZimSwitch API returned invalid response: missing checkout ID');
      }

      // Generate payment link URL from checkout ID
      const linkUrl = `${this.baseUrl}v1/paymentLinks/${checkoutId}`;

      return {
        id: uuidv4(),
        providerReference: checkoutId,
        linkUrl,
        qrCode: response.qrCode,
        status: 'active',
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        expiryDate: input.expiryDate,
        metadata: input.metadata,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch Pay by Link creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pay by Link status — GET /paybylink/v1/{id}.
   * Returns whether the link is active, paid, expired or deactivated.
   */
  async getPaymentLink(linkId: string): Promise<PaymentLinkResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return {
        id: uuidv4(),
        providerReference: linkId,
        linkUrl: `https://test.zimswitchonline.co.zw/v1/paymentLinks/${linkId}`,
        status: 'active',
        amount: 0,
        currency: 'USD',
        reference: linkId,
        providerResponse: { simulated: true, provider: this.name },
      };
    }

    try {
      const response = await this.request(
        `/paybylink/v1/${linkId}?entityId=${encodeURIComponent(this.entityId)}`,
        undefined,
        'GET'
      );

      const state = (response.status || response.state || '').toLowerCase();
      const status: PaymentLinkResult['status'] =
        state === 'paid' ? 'paid'
        : state === 'expired' ? 'expired'
        : state === 'deactivated' || state === 'cancelled' ? 'cancelled'
        : 'active';

      return {
        id: uuidv4(),
        providerReference: linkId,
        linkUrl: response.link || '',
        qrCode: response.qrCode,
        status,
        amount: parseFloat(response.amount || '0'),
        currency: response.currency || 'USD',
        reference: response.merchantTransactionId || '',
        expiryDate: response.validUntil,
        providerResponse: response,
      };
    } catch (error) {
      throw new Error(`ZimSwitch link status failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate a Pay by Link — DELETE /paybylink/v1/{id}.
   * The link can no longer be used for payment after this call.
   */
  async deactivatePaymentLink(linkId: string): Promise<void> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return;
    }

    try {
      await this.request(
        `/paybylink/v1/${linkId}?entityId=${encodeURIComponent(this.entityId)}`,
        undefined,
        'DELETE'
      );
    } catch (error) {
      throw new Error(`ZimSwitch link deactivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a card mandate — a checkout with createRegistration=true.
   * When the shopper completes the widget flow the card is tokenised as a
   * registrationId, which powers recurring merchant-initiated debits.
   */
  async createMandate(input: CreateMandateInput): Promise<MandateResult> {
    this.ensureInitialized();
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return this.simulatedMandate(input);
    }

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
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      return this.simulatedMandateCharge(input);
    }

    const isTest = this.config?.environment === 'test';

    const params = new URLSearchParams({
      entityId: this.entityId,
      amount: input.amount.toFixed(2),
      currency: input.currency || 'USD',
      paymentType: 'DB',
      recurringType: 'REPEATED',
      merchantTransactionId: input.reference,
      // Same test-mode flag as every other ZimSwitch request — without it
      // UAT recurring debits run with live semantics and fail.
      ...(isTest ? { testMode: 'EXTERNAL' } : {}),
    });

    try {
      const response = await this.request(`/v1/registrations/${input.mandateReference}/payments`, params);

      // Some issuers step MIT debits up to 3DS — surface the redirect
      // so the caller can route the shopper through validation.
      if (response.redirect) {
        return {
          id: uuidv4(),
          providerReference: response.id || input.mandateReference,
          status: 'processing',
          checkoutUrl: response.redirect.url,
          redirect: this.parseRedirect(response.redirect),
          amount: input.amount,
          currency: input.currency,
          metadata: input.metadata,
          providerResponse: response,
        };
      }

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
    if (this.shouldSimulate(ZimSwitchProvider.REQUIRED_KEYS)) {
      this.simulatedRevokeMandate(input);
      return;
    }

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
   * Infer the OPE paymentBrand from the card BIN when the caller
   * doesn't supply one. Covers the brands the gateway accepts.
   */
  private detectCardBrand(number: string): string | undefined {
    const pan = (number || '').replace(/\D/g, '');
    if (!pan) return undefined;
    if (/^4/.test(pan)) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(pan)) return 'MASTER';
    if (/^(34|37)/.test(pan)) return 'AMEX';
    if (/^6/.test(pan)) return 'ZIMSWITCH';
    return undefined;
  }

  /**
   * Normalise the gateway's async redirect object. OPE returns
   * { url, method, parameters } where parameters may be an array of
   * { name, value } pairs or a plain map — accept both.
   */
  private parseRedirect(
    redirect: { url?: string; method?: string; parameters?: unknown } | null | undefined
  ): { url: string; method: 'GET' | 'POST'; parameters?: Record<string, string> } | undefined {
    if (!redirect?.url) return undefined;
    let parameters: Record<string, string> | undefined;
    if (Array.isArray(redirect.parameters)) {
      parameters = {};
      for (const p of redirect.parameters as Array<{ name?: string; value?: unknown }>) {
        if (p?.name != null) parameters[p.name] = String(p.value ?? '');
      }
    } else if (redirect.parameters && typeof redirect.parameters === 'object') {
      parameters = Object.fromEntries(
        Object.entries(redirect.parameters as Record<string, unknown>).map(([k, v]) => [k, String(v)])
      );
    }
    return {
      url: redirect.url,
      method: redirect.method === 'GET' ? 'GET' : 'POST',
      parameters,
    };
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
