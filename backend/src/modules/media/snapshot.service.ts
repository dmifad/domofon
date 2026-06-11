import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { S3Service } from './s3.service';

/**
 * Захват кадра с RTSP-потока через ffmpeg и загрузка в S3.
 * Используется при входящем звонке (превью в push) и для журнала событий.
 */
@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);
  private readonly rtspBase = process.env.MEDIA_RTSP_URL ?? 'rtsp://localhost:8554';

  constructor(private readonly s3: S3Service) {}

  /**
   * Возвращает URL снапшота в S3 или null (камера/ffmpeg/S3 недоступны).
   * Никогда не бросает — снапшот не должен ломать критический путь звонка.
   */
  async capture(streamPath: string, keyPrefix: string): Promise<string | null> {
    const frame = await this.grabFrame(`${this.rtspBase}/${streamPath}`);
    if (!frame) return null;
    const key = `${keyPrefix}/${Date.now()}.jpg`;
    return this.s3.upload(key, frame, 'image/jpeg');
  }

  private grabFrame(rtspUrl: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const ff = spawn(
        'ffmpeg',
        ['-rtsp_transport', 'tcp', '-i', rtspUrl, '-frames:v', '1', '-q:v', '4', '-f', 'image2', '-'],
        { stdio: ['ignore', 'pipe', 'ignore'] },
      );
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => {
        ff.kill('SIGKILL');
        resolve(null);
      }, 4000);

      ff.stdout.on('data', (c: Buffer) => chunks.push(c));
      ff.on('close', (code) => {
        clearTimeout(timer);
        resolve(code === 0 && chunks.length > 0 ? Buffer.concat(chunks) : null);
      });
      ff.on('error', (e) => {
        clearTimeout(timer);
        this.logger.debug(`ffmpeg unavailable: ${e.message}`);
        resolve(null);
      });
    });
  }
}
