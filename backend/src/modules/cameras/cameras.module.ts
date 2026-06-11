import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApartmentsModule } from '../apartments/apartments.module';
import { Camera } from './camera.entity';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Camera]), ApartmentsModule],
  providers: [CamerasService],
  controllers: [CamerasController],
})
export class CamerasModule {}
