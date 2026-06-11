import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface CreatedProviderPayment {
  providerId: string;
  confirmationUrl: string;
}

/**
 * Интеграция с ЮKassa. В dev — заглушка, возвращающая фиктивный confirmation URL.
 *
 * PROD: POST https://api.yookassa.ru/v3/payments
 *   auth: Basic base64(shopId:secretKey)
 *   headers: Idempotence-Key: <uuid>
 *   body: { amount: {value, currency: 'RUB'},
 *           confirmation: {type: 'redirect', return_url},
 *           capture: true, description }
 * Статус подтверждается webhook'ом payment.succeeded (см. BillingController.webhook).
 */
@Injectable()
export class YookassaService {
  private readonly logger = new Logger(YookassaService.name);

  async createPayment(amount: string, description: string): Promise<CreatedProviderPayment> {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    if (!shopId) {
      const providerId = `dev-${randomUUID()}`;
      this.logger.debug(`[YooKassa stub] payment ${providerId}: ${amount} ₽ — ${description}`);
      return {
        providerId,
        confirmationUrl: `https://yookassa.example/confirm/${providerId}`,
      };
    }

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Idempotence-Key': randomUUID(),
        authorization:
          'Basic ' +
          Buffer.from(`${shopId}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        confirmation: {
          type: 'redirect',
          return_url: process.env.YOOKASSA_RETURN_URL ?? 'https://domofon.example/payment-done',
        },
        capture: true,
        description,
      }),
    });
    if (!response.ok) {
      throw new Error(`yookassa error: ${response.status}`);
    }
    const json = (await response.json()) as {
      id: string;
      confirmation: { confirmation_url: string };
    };
    return { providerId: json.id, confirmationUrl: json.confirmation.confirmation_url };
  }
}
