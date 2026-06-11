import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CamerasService } from './cameras.service';

type AuthedRequest = { user: { sub: string } };

@ApiTags('cameras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cameras')
export class CamerasController {
  constructor(private readonly cameras: CamerasService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.cameras.listForUser(req.user.sub);
  }

  @Get(':id/stream')
  stream(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.cameras.streamInfo(req.user.sub, id);
  }
}
