import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { AuthService } from './auth.service';

class RequestOtpDto {
  @Matches(/^\+?\d{10,15}$/)
  phone!: string;
}

class VerifyOtpDto {
  @Matches(/^\+?\d{10,15}$/)
  phone!: string;

  @IsString()
  @Length(4, 6)
  code!: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
