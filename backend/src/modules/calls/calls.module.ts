import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsModule } from '../apartments/apartments.module';
import { Apartment } from '../apartments/apartment.entity';
import { UserApartment } from '../apartments/user-apartment.entity';
import { Device } from '../devices/device.entity';
import { EventsModule } from '../events/events.module';
import { IntercomsModule } from '../intercoms/intercoms.module';
import { PushModule } from '../push/push.module';
import { Call } from './call.entity';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { InternalCallsController } from './internal-calls.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Call, Apartment, UserApartment, Device]),
    ApartmentsModule,
    IntercomsModule,
    EventsModule,
    PushModule,
  ],
  providers: [CallsService],
  controllers: [CallsController, InternalCallsController],
})
export class CallsModule {}
