import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CallsService } from './calls.service';

type AuthedRequest = { user: { sub: string } };

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get()
  history(@Req() req: AuthedRequest, @Query('limit') limit?: string) {
    return this.calls.historyForUser(req.user.sub, limit ? Number(limit) : undefined);
  }

  @Post(':id/answer')
  answer(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.calls.answer(req.user.sub, id);
  }

  @Post(':id/decline')
  decline(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.calls.decline(req.user.sub, id);
  }
}
