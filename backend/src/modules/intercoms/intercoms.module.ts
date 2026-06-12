import { Controller, Get, Module, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth';
import { IntercomConfig, loadIntercoms } from '../../config/intercoms';
import { db } from '../../db';
import { DoorOpenerService } from './door-opener.service';

@Controller('intercoms')
@UseGuards(AuthGuard)
class IntercomsController {
  private readonly intercoms = loadIntercoms();

  constructor(private readonly opener: DoorOpenerService) {}

  @Get()
  list(): Array<Pick<IntercomConfig, 'id' | 'name' | 'rtspUrl'>> {
    return this.intercoms.map(({ id, name, rtspUrl }) => ({ id, name, rtspUrl }));
  }

  @Post(':id/open')
  async open(@Param('id') id: string): Promise<{ opened: boolean; method: 'dtmf' | 'http' | 'none' }> {
    const intercom = this.intercoms.find((i) => i.id === id);
    if (!intercom) return { opened: false, method: 'none' };

    const activeCall = db
      .prepare(
        `SELECT * FROM calls WHERE intercom_id = ? AND status IN ('ringing','answered')
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(id) as unknown as { id: string; sip_uri: string | null } | undefined;

    if (activeCall && (activeCall as { sip_uri?: string }).sip_uri) {
      // sip_uri у нас хранит channelId — для простоты MVP
      try {
        await this.opener.openByDtmf(intercom, (activeCall as unknown as { sip_uri: string }).sip_uri);
        return { opened: true, method: 'dtmf' };
      } catch {
        // fallthrough в http
      }
    }
    try {
      await this.opener.openByHttp(intercom);
      return { opened: true, method: 'http' };
    } catch {
      return { opened: false, method: 'http' };
    }
  }
}

@Module({
  controllers: [IntercomsController],
  providers: [DoorOpenerService],
  exports: [DoorOpenerService],
})
export class IntercomsModule {}
