import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  private readonly ttlSeconds = Number(process.env.OTP_TTL_SECONDS ?? 300);

  async issue(phone: string): Promise<number> {
    const code = this.generateCode();
    await this.redis.set(this.key(phone), code, 'EX', this.ttlSeconds);
    await this.sendSms(phone, code);
    return this.ttlSeconds;
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const expected = await this.redis.get(this.key(phone));
    if (!expected || expected !== code) return false;
    await this.redis.del(this.key(phone));
    return true;
  }

  private key(phone: string): string {
    return `otp:${phone}`;
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async sendSms(phone: string, code: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`OTP for ${phone}: ${code}`);
      return;
    }
    // TODO: integrate SMSC / SMS Aero via SMS_PROVIDER
  }
}
