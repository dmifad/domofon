import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { AuthGuard, InternalSecretGuard } from '../../auth';
import { loadIntercoms } from '../../config/intercoms';
import { db } from '../../db';
import { allDevices } from '../devices/devices.module';
import { PushService } from '../push/push.service';

class IncomingCallDto {
  @IsString()
  intercomId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  channelId?: string;
}

class CallStatusDto {
  @IsString()
  callId!: string;
}

interface CallRow {
  id: string;
  intercom_id: string;
  sip_uri: string | null;
  status: string;
  snapshot_url: string | null;
  answered_by: string | null;
  answered_at: string | null;
  ended_at: string | null;
  created_at: string;
}

@Controller('internal/calls')
@UseGuards(InternalSecretGuard)
class InternalCallsController {
  constructor(private readonly push: PushService) {}

  /**
   * Asterisk диалплан зовёт сюда из контекста from-intercom (CURL).
   * Возвращает Dial-направление PJSIP/<dialUri>, которое диалплан передаёт в Dial().
   */
  @Post('incoming')
  async incoming(@Body() dto: IncomingCallDto): Promise<{ callId: string; dial: string }> {
    const intercoms = loadIntercoms();
    const intercom = intercoms.find((i) => i.id === dto.intercomId);
    if (!intercom) return { callId: '', dial: '' };

    const callId = randomUUID();
    db.prepare(
      `INSERT INTO calls (id, intercom_id, sip_uri, status) VALUES (?, ?, ?, 'ringing')`,
    ).run(callId, intercom.id, dto.channelId ?? null);

    const devices = allDevices();
    await this.push.dispatch(devices, {
      type: 'call.incoming',
      callId,
      intercomId: intercom.id,
      intercomName: intercom.name,
      rtspUrl: intercom.rtspUrl,
      channelId: dto.channelId,
    });

    return { callId, dial: intercom.dialUri };
  }

  @Post('ended')
  async ended(@Body() dto: CallStatusDto): Promise<{ ok: true }> {
    db.prepare(
      `UPDATE calls SET status = 'ended', ended_at = datetime('now')
       WHERE id = ? AND status IN ('ringing','answered')`,
    ).run(dto.callId);
    await this.push.dispatch(allDevices(), { type: 'call.ended', callId: dto.callId });
    return { ok: true };
  }

  @Post('missed')
  async missed(@Body() dto: CallStatusDto): Promise<{ ok: true }> {
    db.prepare(
      `UPDATE calls SET status = 'missed', ended_at = datetime('now')
       WHERE id = ? AND status = 'ringing'`,
    ).run(dto.callId);
    await this.push.dispatch(allDevices(), { type: 'call.ended', callId: dto.callId });
    return { ok: true };
  }
}

@Controller('calls')
@UseGuards(AuthGuard)
class CallsController {
  @Get()
  history(): CallRow[] {
    return db
      .prepare('SELECT * FROM calls ORDER BY created_at DESC LIMIT 50')
      .all() as unknown as CallRow[];
  }

  @Post(':id/answer')
  answer(@Param('id') id: string): { ok: boolean } {
    const result = db
      .prepare(
        `UPDATE calls SET status = 'answered', answered_at = datetime('now')
         WHERE id = ? AND status = 'ringing'`,
      )
      .run(id);
    return { ok: result.changes > 0 };
  }
}

import { PushModule } from '../push/push.module';

@Module({
  imports: [PushModule],
  controllers: [InternalCallsController, CallsController],
})
export class CallsModule {}
