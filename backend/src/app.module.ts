import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApartmentsModule } from './modules/apartments/apartments.module';
import { IntercomsModule } from './modules/intercoms/intercoms.module';
import { CamerasModule } from './modules/cameras/cameras.module';
import { DevicesModule } from './modules/devices/devices.module';
import { EventsModule } from './modules/events/events.module';
import { CallsModule } from './modules/calls/calls.module';
import { PushModule } from './modules/push/push.module';
import { BillingModule } from './modules/billing/billing.module';
import { ChatModule } from './modules/chat/chat.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    AuthModule,
    UsersModule,
    ApartmentsModule,
    IntercomsModule,
    CamerasModule,
    DevicesModule,
    EventsModule,
    PushModule,
    CallsModule,
    BillingModule,
    ChatModule,
  ],
})
export class AppModule {}
