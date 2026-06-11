import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Гард для internal-эндпоинтов, которые вызывает Asterisk/диалплан.
 * Проверяет заголовок X-Internal-Secret против INTERNAL_API_SECRET.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-internal-secret');
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected) {
      throw new UnauthorizedException('internal_secret_not_configured');
    }
    if (provided !== expected) {
      throw new UnauthorizedException('invalid_internal_secret');
    }
    return true;
  }
}
