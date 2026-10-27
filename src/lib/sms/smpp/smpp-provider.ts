import { BaseSmsProvider } from '../base';
import {
  SendSmsInput,
  SendSmsResult,
  GetSmsInput,
  SmsProviderCapabilities,
} from '@/types/sms';
import { v4 as uuidv4 } from 'uuid';

/**
 * SMPP v3.4 SMSC provider.
 *
 * Connects to an SMSC (Short Message Service Centre) over the SMPP binary
 * protocol — the standard carrier-grade transport for bulk/transactional SMS.
 *
 * Runtime note: SMPP is a long-lived TCP protocol. Because route handlers
 * are short-lived (and serverless runtimes cannot hold sockets between
 * invocations) this provider performs a connect → bind_transceiver →
 * submit_sm → unbind cycle per send. That is acceptable for transactional
 * volumes; for sustained high-throughput bulk traffic deploy a persistent
 * SMPP worker that owns the bind and consumes a send queue.
 *
 * Requires the `smpp` npm package and a Node.js runtime (not Edge).
 *
 * Credentials expected in SmsProviderConfig.credentials:
 *   host              — SMSC hostname or IP (required)
 *   port              — SMSC TCP port (default 2775)
 *   systemId          — SMPP system_id (required)
 *   password          — SMPP password (secret)
 *   systemType        — optional system_type (default '')
 *   defaultSenderId   — fallback source_addr
 *   sourceAddrTon     — source TON (default 5 = alphanumeric)
 *   sourceAddrNpi     — source NPI (default 0)
 *   destAddrTon       — destination TON (default 1 = international)
 *   destAddrNpi       — destination NPI (default 1)
 *   bindTimeoutMs     — connect+bind timeout (default 15000)
 */
export class SmppProvider extends BaseSmsProvider {
  private host!: string;
  private port!: number;
  private systemId!: string;
  private password!: string;
  private systemType!: string;
  private defaultSenderId?: string;
  private sourceAddrTon!: number;
  private sourceAddrNpi!: number;
  private destAddrTon!: number;
  private destAddrNpi!: number;
  private bindTimeoutMs!: number;

  constructor() {
    super('sms-smpp', 'smpp');
  }

  getCapabilities(): SmsProviderCapabilities {
    return {
      sendSms: true,
      bulkSend: true,
      getDeliveryStatus: false,
      supportsDeliveryReports: true, // via registered_delivery + deliver_sm when bound
    };
  }

  protected onInitialize(): void {
    const c = this.config!.credentials;

    this.host = String(c.host || '');
    this.systemId = String(c.systemId || '');
    this.password = String(c.password || '');
    if (!this.host || !this.systemId || !this.password) {
      throw new Error('SMPP provider requires host, systemId and password');
    }

    this.port = Number(c.port || 2775);
    this.systemType = String(c.systemType || '');
    this.defaultSenderId = c.defaultSenderId ? String(c.defaultSenderId) : undefined;
    this.sourceAddrTon = Number(c.sourceAddrTon ?? 5);
    this.sourceAddrNpi = Number(c.sourceAddrNpi ?? 0);
    this.destAddrTon = Number(c.destAddrTon ?? 1);
    this.destAddrNpi = Number(c.destAddrNpi ?? 1);
    this.bindTimeoutMs = Number(c.bindTimeoutMs || 15000);
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    this.ensureInitialized();

    // Lazy require — the `smpp` package uses raw TCP sockets and must not
    // be loaded in Edge/browser bundles.
    const smpp = require('smpp');

    const senderId = input.senderId || this.defaultSenderId;

    return new Promise<SendSmsResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        try { session.close(); } catch {}
        reject(new Error(`SMPP operation timed out after ${this.bindTimeoutMs}ms`));
      }, this.bindTimeoutMs);

      const session = smpp.connect(
        { host: this.host, port: this.port },
        () => {
          session.bind_transceiver(
            {
              system_id: this.systemId,
              password: this.password,
              system_type: this.systemType,
            },
            (bindPdu: any) => {
              if (bindPdu.command_status !== 0) {
                clearTimeout(timeout);
                try { session.close(); } catch {}
                return reject(
                  new Error(`SMPP bind failed, command_status=${bindPdu.command_status}`)
                );
              }

              session.submit_sm(
                {
                  source_addr: senderId || '',
                  source_addr_ton: this.sourceAddrTon,
                  source_addr_npi: this.sourceAddrNpi,
                  destination_addr: input.to,
                  dest_addr_ton: this.destAddrTon,
                  dest_addr_npi: this.destAddrNpi,
                  short_message: input.text,
                  registered_delivery: input.requestDeliveryReport ? 1 : 0,
                },
                (submitPdu: any) => {
                  clearTimeout(timeout);
                  try { session.unbind(() => session.close()); } catch { try { session.close(); } catch {} }

                  if (submitPdu.command_status !== 0) {
                    return reject(
                      new Error(`SMPP submit_sm failed, command_status=${submitPdu.command_status}`)
                    );
                  }

                  resolve({
                    id: uuidv4(),
                    providerReference: String(submitPdu.message_id || ''),
                    status: 'sent',
                    to: input.to,
                    senderId,
                    externalReference: input.externalReference,
                    segments: this.countSegments(input.text),
                    metadata: input.metadata,
                    providerResponse: { messageId: submitPdu.message_id },
                  });
                }
              );
            }
          );
        }
      );

      session.on('error', (err: Error) => {
        clearTimeout(timeout);
        try { session.close(); } catch {}
        reject(new Error(`SMPP transport error: ${err.message}`));
      });
    });
  }

  async getSmsStatus(_input: GetSmsInput): Promise<SendSmsResult> {
    throw new Error(
      'SMPP does not support status polling — delivery status arrives via deliver_sm PDUs on a persistent bind. Deploy a dedicated SMPP worker to receive delivery receipts.'
    );
  }

  /**
   * GSM-7 segment estimate for billing. Accurate segmentation requires
   * full septet encoding; this is a pragmatic approximation.
   */
  private countSegments(text: string): number {
    // Basic UCS-2 detection (non-GSM chars) → 70/67 limits, else 160/153
    const isUcs2 = /[^\x20-\x7E£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-.\/:;<=>?¡ÄÖÑÜ§¿äöñüà@\^\\\\{}~\[\]€]/.test(text);
    const single = isUcs2 ? 70 : 160;
    const multi = isUcs2 ? 67 : 153;
    if (text.length <= single) return 1;
    return Math.ceil(text.length / multi);
  }
}
