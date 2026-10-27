import { SmsProvider, SmsProviderConfig } from './interface';
import {
  SendSmsInput,
  SendSmsResult,
  BulkSmsInput,
  BulkSmsResult,
  GetSmsInput,
  SmsProviderCapabilities,
  SmsTransport,
} from '@/types/sms';
import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for SMS gateway providers.
 * Provides common functionality and enforces implementation of required methods.
 */
export abstract class BaseSmsProvider implements SmsProvider {
  protected config: SmsProviderConfig | null = null;

  constructor(
    public readonly name: string,
    public readonly transport: SmsTransport
  ) {}

  initialize(config: SmsProviderConfig): void {
    this.config = config;
    this.onInitialize(config);
  }

  protected onInitialize(_config: SmsProviderConfig): void {
    // Override in subclasses if needed
  }

  protected ensureInitialized(): void {
    if (!this.config) {
      throw new Error(`SMS provider ${this.name} is not initialized`);
    }
  }

  abstract getCapabilities(): SmsProviderCapabilities;
  abstract sendSms(input: SendSmsInput): Promise<SendSmsResult>;

  /**
   * Default bulk implementation — sequential single sends.
   * Providers with native batch endpoints should override this.
   */
  async sendBulkSms(input: BulkSmsInput): Promise<BulkSmsResult> {
    const batchId = uuidv4();
    const results: SendSmsResult[] = [];
    let failed = 0;

    for (const recipient of input.to) {
      try {
        const result = await this.sendSms({
          to: recipient,
          text: input.text,
          senderId: input.senderId,
          externalReference: input.externalReference,
          requestDeliveryReport: input.requestDeliveryReport,
          metadata: { ...input.metadata, batchId },
        });
        results.push(result);
        if (result.status === 'failed' || result.status === 'rejected') failed++;
      } catch (error) {
        failed++;
        results.push({
          id: uuidv4(),
          providerReference: '',
          status: 'failed',
          to: recipient,
          senderId: input.senderId,
          externalReference: input.externalReference,
          metadata: {
            ...input.metadata,
            batchId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return {
      id: batchId,
      batchReference: input.externalReference || batchId,
      total: input.to.length,
      queued: input.to.length - failed,
      failed,
      results,
    };
  }

  async getSmsStatus?(input: GetSmsInput): Promise<SendSmsResult> {
    throw new Error(`Delivery status lookup not supported by provider ${this.name}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.ensureInitialized();
      return true;
    } catch {
      return false;
    }
  }
}
