import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevicePlatform } from './device.entity';
import { DevicesService } from './devices.service';

class RegisterDeviceDto {
  @IsIn(['android', 'ios'])
  platform!: DevicePlatform;

  @IsString()
  @Length(1, 300)
  pushToken!: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  voipToken?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  appVersion?: string;
}

type AuthedRequest = { user: { sub: string } };

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.devices.listForUser(req.user.sub);
  }

  @Post()
  register(@Req() req: AuthedRequest, @Body() dto: RegisterDeviceDto) {
    return this.devices.register(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.devices.remove(req.user.sub, id);
  }
}
