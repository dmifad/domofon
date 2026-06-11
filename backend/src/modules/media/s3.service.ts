import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

/**
 * Обёртка над S3-совместимым хранилищем (MinIO в dev, любой S3 в prod).
 * Хранит снапшоты с камер и (позднее) выгрузки архива.
 */
@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket = process.env.S3_BUCKET ?? 'domofon';

  private readonly client = new Client({
    endPoint: new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000').hostname,
    port: Number(new URL(process.env.S3_ENDPOINT ?? 'http://localhost:9000').port || 9000),
    useSSL: (process.env.S3_ENDPOINT ?? '').startsWith('https'),
    accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
  });

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, process.env.S3_REGION ?? 'ru-central1');
        this.logger.log(`Created bucket "${this.bucket}"`);
      }
    } catch (e) {
      this.logger.warn(`S3 unavailable, snapshots disabled: ${(e as Error).message}`);
    }
  }

  /** Загружает объект и возвращает публичный URL (или null при недоступном S3). */
  async upload(key: string, body: Buffer, contentType: string): Promise<string | null> {
    try {
      await this.client.putObject(this.bucket, key, body, body.length, {
        'Content-Type': contentType,
      });
      const base = process.env.S3_PUBLIC_URL ?? process.env.S3_ENDPOINT ?? 'http://localhost:9000';
      return `${base}/${this.bucket}/${key}`;
    } catch (e) {
      this.logger.warn(`S3 upload failed: ${(e as Error).message}`);
      return null;
    }
  }
}
