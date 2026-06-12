import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CallsModule } from './modules/calls/calls.module';
import { DevicesModule } from './modules/devices/devices.module';
import { IntercomsModule } from './modules/intercoms/intercoms.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PushModule,
    DevicesModule,
    IntercomsModule,
    CallsModule,
  ],
})
export class AppModule {}
