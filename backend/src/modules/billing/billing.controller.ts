import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { MeterType } from './billing.entities';

class CreatePaymentDto {
  @IsUUID()
  accountId!: string;

  @IsNumberString()
  amount!: string;
}

class SubmitMeterDto {
  @IsUUID()
  apartmentId!: string;

  @IsIn(['cold_water', 'hot_water', 'electricity', 'heating'])
  meterType!: MeterType;

  @IsNumberString()
  value!: string;
}

class YookassaWebhookDto {
  @IsString()
  event!: string;

  @IsOptional()
  object?: { id?: string };
}

type AuthedRequest = { user: { sub: string } };

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('accounts')
  accounts(@Req() req: AuthedRequest) {
    return this.billing.accountsForUser(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('charges')
  charges(@Req() req: AuthedRequest, @Query('accountId') accountId?: string) {
    return this.billing.chargesForUser(req.user.sub, accountId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('payments')
  pay(@Req() req: AuthedRequest, @Body() dto: CreatePaymentDto) {
    return this.billing.createPayment(req.user.sub, dto.accountId, dto.amount);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('meters')
  submitMeter(@Req() req: AuthedRequest, @Body() dto: SubmitMeterDto) {
    return this.billing.submitMeter(req.user.sub, dto.apartmentId, dto.meterType, dto.value);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('meters')
  meters(@Req() req: AuthedRequest, @Query('apartmentId') apartmentId: string) {
    return this.billing.metersForUser(req.user.sub, apartmentId);
  }

  /**
   * Webhook ЮKassa (без JWT — валидируется по IP-листу ЮKassa на ingress
   * + проверкой статуса через API в проде).
   */
  @Post('webhook/yookassa')
  async webhook(@Body() dto: YookassaWebhookDto) {
    if (dto.event === 'payment.succeeded' && dto.object?.id) {
      await this.billing.confirmPayment(dto.object.id);
    }
    return { ok: true };
  }
}
