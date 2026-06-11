import { Injectable, Logger } from '@nestjs/common';
import { Device } from '../devices/device.entity';

export interface CallPushPayload {
  type: 'call.incoming';
  callId: string;
  intercomId: string;
  intercomName: string;
  sipUri: string;
  buildingAddress: string;
  snapshotUrl?: string;
  /** HLS-поток камеры панели для видеопревью до ответа. */
  previewUrl?: string;
}

/**
 * Отвечает за доставку push-уведомлений на устройства жителей.
 * FCM и APNs реализованы стабами, которые логируют payload;
 * подключение реальных провайдеров — в env (FCM_CREDENTIALS_PATH, APNS_*).
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async dispatchCall(devices: Device[], payload: CallPushPayload): Promise<void> {
    const android = devices.filter((d) => d.platform === 'android');
    const ios = devices.filter((d) => d.platform === 'ios');

    await Promise.allSettled([
      ...android.map((d) => this.sendFcmHighPriority(d, payload)),
      ...ios.map((d) => this.sendApnsVoip(d, payload)),
    ]);
  }

  private async sendFcmHighPriority(device: Device, payload: CallPushPayload): Promise<void> {
    // PROD: firebase-admin
    //   await admin.messaging().send({
    //     token: device.pushToken,
    //     android: { priority: 'high', ttl: 0 },
    //     data: Object.fromEntries(Object.entries(payload).map(([k,v]) => [k, String(v ?? '')]))
    //   });
    this.logger.debug(
      `[FCM→${device.pushToken.slice(0, 12)}…] high-priority data ${JSON.stringify(payload)}`,
    );
  }

  private async sendApnsVoip(device: Device, payload: CallPushPayload): Promise<void> {
    const token = device.voipToken ?? device.pushToken;
    // PROD: @parse/node-apn или http2 + JWT
    //   const note = new apn.Notification();
    //   note.pushType = 'voip';
    //   note.topic = `${APNS_BUNDLE_ID}.voip`;
    //   note.payload = payload;
    //   await apnsProvider.send(note, token);
    this.logger.debug(
      `[APNs VoIP→${token.slice(0, 12)}…] ${JSON.stringify(payload)}`,
    );
  }
}
