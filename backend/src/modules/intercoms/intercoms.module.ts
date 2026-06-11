import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsModule } from '../apartments/apartments.module';
import { EventsModule } from '../events/events.module';
import { Intercom } from './intercom.entity';
import { IntercomsService } from './intercoms.service';
import { IntercomsController } from './intercoms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Intercom]), ApartmentsModule, EventsModule],
  providers: [IntercomsService],
  controllers: [IntercomsController],
})
export class IntercomsModule {}
