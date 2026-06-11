import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apartment } from './apartment.entity';
import { UserApartment } from './user-apartment.entity';
import { ApartmentsService } from './apartments.service';
import { ApartmentsController } from './apartments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Apartment, UserApartment])],
  providers: [ApartmentsService],
  controllers: [ApartmentsController],
  exports: [ApartmentsService],
})
export class ApartmentsModule {}
