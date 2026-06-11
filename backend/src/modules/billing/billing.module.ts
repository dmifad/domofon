import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsModule } from '../apartments/apartments.module';
import { BillingAccount, Charge, MeterReading, Payment } from './billing.entities';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { YookassaService } from './yookassa.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingAccount, Charge, Payment, MeterReading]),
    ApartmentsModule,
  ],
  providers: [BillingService, YookassaService],
  controllers: [BillingController],
})
export class BillingModule {}
