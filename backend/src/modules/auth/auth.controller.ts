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

@Controller('auth')
export class AuthController {
  /**
   * Логин MVP: пара логин/PIN из ENV (USERS=alice:1234,bob:5678).
   * Возвращает Bearer-токен, который хранится в памяти процесса.
   */
  @Post('login')
  login(@Body() dto: LoginDto): { token: string; userId: string } {
    const raw = process.env.USERS ?? 'demo:1234';
    const map = new Map<string, string>();
    for (const pair of raw.split(',')) {
      const [name, pin] = pair.split(':');
      if (name && pin) map.set(name.trim(), pin.trim());
    }
    const expected = map.get(dto.username);
    if (!expected) throw new UnauthorizedException('unknown_user');
    if (expected !== dto.pin) throw new UnauthorizedException('invalid_pin');

    const token = tokens.issue(dto.username);
    return { token, userId: dto.username };
  }
}
