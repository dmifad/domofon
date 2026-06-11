import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(phone: string): Promise<{ sent: boolean; ttl: number }> {
    const normalized = this.normalizePhone(phone);
    const ttl = await this.otp.issue(normalized);
    return { sent: true, ttl };
  }

  async verifyOtp(phone: string, code: string) {
    const normalized = this.normalizePhone(phone);
    const ok = await this.otp.verify(normalized, code);
    if (!ok) throw new UnauthorizedException('invalid_otp');
    const user = await this.users.findOrCreateByPhone(normalized);
    return this.issueTokens(user.id, user.phone);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; phone: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
      });
      return this.issueTokens(payload.sub, payload.phone);
    } catch {
      throw new UnauthorizedException('invalid_refresh_token');
    }
  }

  private async issueTokens(sub: string, phone: string) {
    const access = await this.jwt.signAsync({ sub, phone });
    const refresh = await this.jwt.signAsync(
      { sub, phone },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
        expiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
      },
    );
    return { accessToken: access, refreshToken: refresh };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('8') ? '+7' + digits.slice(1) : '+' + digits;
  }
}
