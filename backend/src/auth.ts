import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { randomBytes } from 'node:crypto';

/**
 * Stateless auth: один токен на одного жителя, выдаётся при PIN-логине.
 * Хранится в памяти процесса — для MVP достаточно. При перезапуске нужно перелогиниться.
 */
class TokenStore {
  private readonly tokens = new Map<string, string>(); // token -> userId

  issue(userId: string): string {
    const token = randomBytes(24).toString('hex');
    this.tokens.set(token, userId);
    return token;
  }

  userId(token: string): string | undefined {
    return this.tokens.get(token);
  }

  revoke(token: string): void {
    this.tokens.delete(token);
  }
}

export const tokens = new TokenStore();

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing_token');
    }
    const token = header.slice(7);
    const userId = tokens.userId(token);
    if (!userId) throw new UnauthorizedException('invalid_token');
    (req as Request & { user: { sub: string } }).user = { sub: userId };
    return true;
  }
}

@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-internal-secret');
    const expected = process.env.INTERNAL_API_SECRET;
    if (!expected || provided !== expected) {
      throw new UnauthorizedException('invalid_internal_secret');
    }
    return true;
  }
}
