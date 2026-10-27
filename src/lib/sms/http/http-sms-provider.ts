import { BaseSmsProvider } from '../base';
import {
  SendSmsInput,
  SendSmsResult,
  GetSmsInput,
  SmsProviderCapabilities,
} from '@/types/sms';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generic HTTP SMS gateway provider.
 *
 * Covers the common REST pattern used by most SMS aggregators
 * (Infobip, Twilio-compatible, AfricasTalking-style, local SMSCs
 * exposing an HTTP submit endpoint):
 *
 *   POST {endpoint}                 send a message
 *   GET  {statusEndpoint}/{id}      poll delivery status (optional)
 *
 * Auth: Bearer token or Basic auth — configured via credentials.
 *
 * Field names are configurable so a single provider class can adapt to
 * gateways that use different parameter names without code changes.
 *
 * Credentials expected in SmsProviderConfig.credentials:
 *   endpoint         — POST URL for message submission (required)
 *   statusEndpoint   — GET URL base for status polling (optional)
 *   accessToken      — Bearer token (optional)
 *   username         — Basic auth user (optional, with password)
 *   password         — Basic auth password (secret)
 *   authHeader       — custom auth header name when not Bearer (optional)
 *   defaultSenderId  — fallback sender ID when request omits it
 *   bodyFormat       — 'json' (default) or 'form' (urlencoded)
 *   fieldTo          — param name for recipient (default: 'to')
 *   fieldText        — param name for message text (default: 'text')
 *   fieldSender      — param name for sender ID (default: 'from')
 *   fieldReference   — param name for client reference (default: 'clientRef')
 */
export class HttpSmsProvider extends BaseSmsProvider {
  private endpoint!: string;
  private statusEndpoint?: string;
  private accessToken?: string;
  private username?: string;
  private password?: string;
  private authHeader?: string;
  private defaultSenderId?: string;
  private bodyFormat!: 'json' | 'form';
  private fieldTo!: string;
  private fieldText!: string;
  private fieldSender!: string;
  private fieldReference!: string;

  constructor() {
    super('sms-http', 'http');
  }

  getCapabilities(): SmsProviderCapabilities {
    return {
      sendSms: true,
      bulkSend: true,
      getDeliveryStatus: true,
      supportsDeliveryReports: true,
    };
  }

  protected onInitialize(): void {
    const c = this.config!.credentials;

    this.endpoint = String(c.endpoint || '');
    if (!this.endpoint) {
      throw new Error('HTTP SMS provider requires an endpoint URL');
    }

    this.statusEndpoint = c.statusEndpoint ? String(c.statusEndpoint) : undefined;
    this.accessToken = c.accessToken ? String(c.accessToken) : undefined;
    this.username = c.username ? String(c.username) : undefined;
    this.password = c.password ? String(c.password) : undefined;
    this.authHeader = c.authHeader ? String(c.authHeader) : undefined;
    this.defaultSenderId = c.defaultSenderId ? String(c.defaultSenderId) : undefined;
    this.bodyFormat = c.bodyFormat === 'form' ? 'form' : 'json';
    this.fieldTo = String(c.fieldTo || 'to');
    this.fieldText = String(c.fieldText || 'text');
    this.fieldSender = String(c.fieldSender || 'from');
    this.fieldReference = String(c.fieldReference || 'clientRef');
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    this.ensureInitialized();

    const senderId = input.senderId || this.defaultSenderId;
    const payload: Record<string, string | boolean | undefined> = {
      [this.fieldTo]: input.to,
      [this.fieldText]: input.text,
      [this.fieldReference]: input.externalReference,
      ...(senderId ? { [this.fieldSender]: senderId } : {}),
      ...(input.requestDeliveryReport ? { deliveryReport: true } : {}),
    };

    const body =
      this.bodyFormat === 'form'
        ? new URLSearchParams(
            Object.entries(payload).filter(([, v]) => v !== undefined) as [string, string][]
          ).toString()
        : JSON.stringify(payload);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.buildHeaders(),
        body,
      });

      const text = await response.text();
      let data: Record<string, any> = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Non-JSON responses from legacy SMSCs — keep raw text
        data = { raw: text };
      }

      if (!response.ok) {
        throw new Error(
          `SMS gateway error: ${response.status} - ${data.message || data.error || text || response.statusText}`
        );
      }

      const providerReference =
        (data.messageId || data.id || data.message_id || data.smsId || '') as string;

      return {
        id: uuidv4(),
        providerReference: String(providerReference || ''),
        status: this.mapGatewayStatus(data.status),
        to: input.to,
        senderId,
        externalReference: input.externalReference,
        segments: data.segments ? Number(data.segments) : undefined,
        metadata: input.metadata,
        providerResponse: data,
      };
    } catch (error) {
      throw new Error(
        `HTTP SMS send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSmsStatus(input: GetSmsInput): Promise<SendSmsResult> {
    this.ensureInitialized();
    if (!this.statusEndpoint) {
      throw new Error('Status endpoint not configured for this SMS provider');
    }

    const base = this.statusEndpoint.endsWith('/')
      ? this.statusEndpoint
      : `${this.statusEndpoint}/`;

    try {
      const response = await fetch(`${base}${encodeURIComponent(input.providerReference)}`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      const data = (await response.json()) as Record<string, any>;
      if (!response.ok) {
        throw new Error(`SMS status lookup failed: ${response.status} - ${data.message || response.statusText}`);
      }

      return {
        id: uuidv4(),
        providerReference: input.providerReference,
        status: this.mapGatewayStatus(data.status || data.deliveryStatus),
        to: String(data.to || data.recipient || ''),
        externalReference: data.clientRef || data.reference,
        providerResponse: data,
      };
    } catch (error) {
      throw new Error(
        `SMS status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    headers['Content-Type'] =
      this.bodyFormat === 'form'
        ? 'application/x-www-form-urlencoded'
        : 'application/json';

    if (this.authHeader && this.accessToken) {
      headers[this.authHeader] = this.accessToken;
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.username && this.password) {
      headers['Authorization'] =
        `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;
    }

    return headers;
  }

  /**
   * Normalise gateway status strings into the canonical SmsStatus set.
   * Accepts common variants across aggregators.
   */
  private mapGatewayStatus(status?: string): SendSmsResult['status'] {
    if (!status) return 'sent';
    const s = status.toLowerCase();
    if (['delivered', 'deliverd', 'delivrd', 'ok'].includes(s)) return 'delivered';
    if (['sent', 'submitted', 'submited', 'accepted', 'queued'].includes(s)) return 'sent';
    if (['failed', 'rejected', 'rejectd', 'undelivered', 'expired', 'deleted'].includes(s)) return 'failed';
    if (['rejected'].includes(s)) return 'rejected';
    return 'sent';
  }
}
