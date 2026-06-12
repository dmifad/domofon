import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { WsGateway } from './ws.gateway';

@Module({
  providers: [PushService, WsGateway],
  exports: [PushService, WsGateway],
})
export class PushModule {}
