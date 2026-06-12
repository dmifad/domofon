import { Injectable, Logger } from '@nestjs/common';
import { IntercomConfig } from '../../config/intercoms';

/**
 * Открытие двери двумя способами:
 *  1. DTMF в активном звонке (через Asterisk ARI POST /channels/{id}/dtmf).
 *  2. HTTP API панели (вне звонка) — env <PREFIX>_OPEN_URL.
 *
 * Выбор делает CallsService:
 *  - если есть активный SIP-канал (call.status = 'answered' или 'ringing') — DTMF;
 *  - иначе HTTP к панели.
 */
@Injectable()
export class DoorOpenerService {
  private readonly logger = new Logger(DoorOpenerService.name);

  async openByHttp(intercom: IntercomConfig): Promise<void> {
    if (!intercom.openUrl) {
      this.logger.warn(`Intercom ${intercom.id} has no OPEN_URL`);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const headers: Record<string, string> = {};
      if (intercom.openAuth) {
        headers.authorization = 'Basic ' + Buffer.from(intercom.openAuth).toString('base64');
      }
      const res = await fetch(intercom.openUrl, {
        method: intercom.openMethod ?? 'POST',
        signal: controller.signal,
        headers,
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      this.logger.log(`Door opened via HTTP for ${intercom.id}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Открытие через DTMF — Asterisk ARI.
   * channelId приходит в webhook POST /internal/calls/incoming.
   * См. https://wiki.asterisk.org/wiki/display/AST/Asterisk+REST+Interface+(ARI)
   */
  async openByDtmf(intercom: IntercomConfig, channelId: string): Promise<void> {
    const ariBase = process.env.ARI_URL;
    if (!ariBase) {
      this.logger.warn('ARI_URL not set; cannot send DTMF');
      return;
    }
    const auth = Buffer.from(
      `${process.env.ARI_USER ?? 'domofon'}:${process.env.ARI_PASSWORD ?? 'domofon'}`,
    ).toString('base64');

    const url = new URL(`${ariBase}/channels/${encodeURIComponent(channelId)}/dtmf`);
    url.searchParams.set('dtmf', intercom.openDtmf);
    url.searchParams.set('between', '100');
    url.searchParams.set('duration', '250');

    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      throw new Error(`ARI dtmf failed: ${res.status}`);
    }
    this.logger.log(`DTMF ${intercom.openDtmf} sent via ARI to ${channelId}`);
  }
}
