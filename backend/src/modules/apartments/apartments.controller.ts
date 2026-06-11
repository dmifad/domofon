import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApartmentsService } from './apartments.service';

class LinkApartmentDto {
  @IsString()
  @Length(1, 32)
  accountNumber!: string;

  @IsString()
  @Length(1, 16)
  linkCode!: string;
}

type AuthedRequest = { user: { sub: string } };

@ApiTags('apartments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartments: ApartmentsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.apartments.listForUser(req.user.sub);
  }

  @Post('link')
  link(@Req() req: AuthedRequest, @Body() dto: LinkApartmentDto) {
    return this.apartments.link(req.user.sub, dto.accountNumber, dto.linkCode);
  }
}
