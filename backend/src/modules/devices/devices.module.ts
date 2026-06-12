import { Body, Controller, Module, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, Length } from 'class-validator';
import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { AuthGuard } from '../../auth';
import { db } from '../../db';

class RegisterDeviceDto {
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @IsString()
  @Length(1, 400)
  pushToken!: string;
}

@Controller('devices')
@UseGuards(AuthGuard)
class DevicesController {
  @Post()
  register(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: RegisterDeviceDto,
  ): { ok: true } {
    const userId = req.user.sub;
    const existing = db
      .prepare('SELECT id FROM devices WHERE push_token = ?')
      .get(dto.pushToken) as unknown as { id: string } | undefined;

    if (existing) {
      db.prepare('UPDATE devices SET user_id = ?, platform = ? WHERE id = ?').run(
        userId,
        dto.platform,
        existing.id,
      );
    } else {
      db.prepare(
        'INSERT INTO devices (id, user_id, platform, push_token) VALUES (?, ?, ?, ?)',
      ).run(randomUUID(), userId, dto.platform, dto.pushToken);
    }
    return { ok: true };
  }
}

export interface DeviceRow {
  id: string;
  user_id: string;
  platform: 'android' | 'ios';
  push_token: string;
}

export function allDevices(): DeviceRow[] {
  return db.prepare('SELECT * FROM devices').all() as unknown as DeviceRow[];
}

@Module({ controllers: [DevicesController] })
export class DevicesModule {}
