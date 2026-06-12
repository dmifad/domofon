import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { tokens } from '../../auth';

class LoginDto {
  @IsString()
  @Length(1, 32)
  username!: string;

  @IsString()
  @Length(1, 32)
  pin!: string;
}

interface SipCredentials {
  domain: string;
  username: string;
  password: string;
}

interface UserEntry {
  pin: string;
  sip?: SipCredentials;
}

@Controller('auth')
export class AuthController {
  /**
   * Логин MVP. Формат USERS:
   *   name:pin                      — без SIP (только открытие двери по HTTP)
   *   name:pin:sipUser:sipPass     — c SIP-аккаунтом (приём звонков)
   * SIP-домен общий — env SIP_DOMAIN (IP/hostname Asterisk).
   *
   * Пример: USERS=demo:1234:user1:secret  SIP_DOMAIN=192.168.1.10
   */
  @Post('login')
  login(@Body() dto: LoginDto): { token: string; userId: string; sip: SipCredentials | null } {
    const raw = process.env.USERS ?? 'demo:1234';
    const sipDomain = process.env.SIP_DOMAIN;
    const map = new Map<string, UserEntry>();
    for (const entry of raw.split(',')) {
      const [name, pin, sipUser, sipPass] = entry.split(':').map((s) => s?.trim());
      if (!name || !pin) continue;
      map.set(name, {
        pin,
        sip:
          sipUser && sipPass && sipDomain
            ? { domain: sipDomain, username: sipUser, password: sipPass }
            : undefined,
      });
    }
    const user = map.get(dto.username);
    if (!user) throw new UnauthorizedException('unknown_user');
    if (user.pin !== dto.pin) throw new UnauthorizedException('invalid_pin');

    const token = tokens.issue(dto.username);
    return { token, userId: dto.username, sip: user.sip ?? null };
  }
}
