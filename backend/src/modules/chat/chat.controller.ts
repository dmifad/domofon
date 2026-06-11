import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsUUID()
  apartmentId!: string;

  @IsString()
  @Length(1, 4000)
  text!: string;
}

type AuthedRequest = { user: { sub: string } };

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('messages')
  history(
    @Req() req: AuthedRequest,
    @Query('apartmentId') apartmentId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chat.history(req.user.sub, apartmentId, cursor);
  }

  @Post('messages')
  send(@Req() req: AuthedRequest, @Body() dto: SendMessageDto) {
    return this.chat.send(req.user.sub, dto.apartmentId, dto.text);
  }

  @Get('announcements')
  announcements(@Req() req: AuthedRequest) {
    return this.chat.announcementsForUser(req.user.sub);
  }
}
