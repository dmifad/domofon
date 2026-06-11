import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsModule } from '../apartments/apartments.module';
import { EventsModule } from '../events/events.module';
import { Intercom } from './intercom.entity';
import { IntercomsService } from './intercoms.service';
import { IntercomsController } from './intercoms.controller';
import { DoorOpenerService } from './door-opener.service';

@Module({
  imports: [TypeOrmModule.forFeature([Intercom]), ApartmentsModule, EventsModule],
  providers: [IntercomsService, DoorOpenerService],
  controllers: [IntercomsController],
  exports: [IntercomsService],
})
export class IntercomsModule {}
