import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventType } from './event.entity';
import { EventsService } from './events.service';

type AuthedRequest = { user: { sub: string } };

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('type') type?: EventType,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.events.listForUser(req.user.sub, {
      type,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
