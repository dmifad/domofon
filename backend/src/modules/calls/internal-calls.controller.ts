import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { InternalSecretGuard } from '../../common/internal-secret.guard';
import { CallsService } from './calls.service';

class IncomingCallDto {
  @IsUUID()
  intercomId!: string;

  @IsString()
  @Length(1, 16)
  apartmentNumber!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  channelId?: string;
}

class EndCallDto {
  @IsUUID()
  callId!: string;
}

@ApiTags('internal')
@UseGuards(InternalSecretGuard)
@Controller('internal/calls')
export class InternalCallsController {
  constructor(private readonly calls: CallsService) {}

  @Post('incoming')
  incoming(@Body() dto: IncomingCallDto) {
    return this.calls.ringApartment(dto);
  }

  @Post('end')
  async end(@Body() dto: EndCallDto) {
    await this.calls.end(dto.callId);
    return { ok: true };
  }

  @Post('missed')
  async missed(@Body() dto: EndCallDto) {
    await this.calls.markMissed(dto.callId, 'no_answer');
    return { ok: true };
  }
}
