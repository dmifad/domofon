import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { DeviceRow } from '../devices/devices.module';

export interface IncomingCallPayload {
  type: 'call.incoming';
  callId: string;
  intercomId: string;
  intercomName: string;
  rtspUrl?: string;
  channelId?: string;
}

export interface CallEndedPayload {
  type: 'call.ended';
  callId: string;
}

export type CallPayload = IncomingCallPayload | CallEndedPayload;

/**
 * Доставляет события звонков:
 *  - Android: FCM data high-priority (показывает входящий через ConnectionService).
 *  - iOS: Socket.IO (передаётся в WsGateway).
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp?: App;
  /** Сеттится WsGateway при инициализации. */
  public wsBroadcast: (userIds: string[], payload: CallPayload) => void = () => {};

  async onModuleInit(): Promise<void> {
    const credsPath = process.env.FCM_CREDENTIALS_PATH;
    if (!credsPath) {
      this.logger.warn('FCM_CREDENTIALS_PATH not set — Android push disabled');
      return;
    }
    try {
      const { initializeApp, cert } = await import('firebase-admin/app');
      const { readFileSync } = await import('node:fs');
      const credentials = JSON.parse(readFileSync(credsPath, 'utf8'));
      this.firebaseApp = initializeApp({ credential: cert(credentials) });
      this.logger.log('Firebase Admin initialized');
    } catch (e) {
      this.logger.error(`Firebase init failed: ${(e as Error).message}`);
    }
  }

  async dispatch(devices: DeviceRow[], payload: CallPayload): Promise<void> {
    const android = devices.filter((d) => d.platform === 'android');
    const ios = devices.filter((d) => d.platform === 'ios');

    this.wsBroadcast([...new Set(ios.map((d) => d.user_id))], payload);

    if (android.length > 0) {
      await this.sendFcm(android, payload);
    }
  }

  private async sendFcm(devices: DeviceRow[], payload: CallPayload): Promise<void> {
    if (!this.firebaseApp) {
      this.logger.debug(`[FCM stub] ${JSON.stringify(payload)} → ${devices.length} devices`);
      return;
    }
    const { getMessaging } = await import('firebase-admin/messaging');
    const messaging = getMessaging(this.firebaseApp);
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) data[k] = String(v);
    }
    const results = await Promise.allSettled(
      devices.map((d) =>
        messaging.send({
          token: d.push_token,
          data,
          android: { priority: 'high', ttl: 0 },
        }),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(`FCM: ${failed.length} of ${devices.length} failed`);
    }
  }
}
