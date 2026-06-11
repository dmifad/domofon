import { Injectable, Logger } from '@nestjs/common';
import { Intercom } from './intercom.entity';

/**
 * Открытие двери. Реальный транспорт зависит от модели панели:
 * - HTTP API (большинство современных панелей: Beward, BAS-IP, Akuvox) — POST на open_url
 * - SIP INFO с DTMF (если открытие реализовано через DTMF в активном звонке) — TODO
 *
 * Здесь — HTTP-вариант с конфигурируемым timeout. Для SIP INFO нужна интеграция с ARI.
 */
@Injectable()
export class DoorOpenerService {
  private readonly logger = new Logger(DoorOpenerService.name);

  async open(intercom: Intercom): Promise<void> {
    if (!intercom.openUrl) {
      this.logger.warn(`Intercom ${intercom.id} has no openUrl; door open is a no-op`);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(intercom.openUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      });
      if (!response.ok) {
        throw new Error(`door open failed: ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
