import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntercomsService } from './intercoms.service';

type AuthedRequest = { user: { sub: string } };

@ApiTags('intercoms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('intercoms')
export class IntercomsController {
  constructor(private readonly intercoms: IntercomsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.intercoms.listForUser(req.user.sub);
  }

  @Post(':id/open')
  open(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.intercoms.open(req.user.sub, id);
  }
}
