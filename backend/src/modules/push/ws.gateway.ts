import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { tokens } from '../../auth';
import { CallPayload, PushService } from './push.service';

/**
 * Socket.IO-канал для iOS (и для отладки в браузере).
 * Клиент подключается с `auth: { token }`, сервер шлёт ему 'call' events.
 */
@Injectable()
export class WsGateway implements OnModuleInit {
  private readonly logger = new Logger(WsGateway.name);
  private io?: Server;
  /** userId -> Set<socketId> */
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly push: PushService) {}

  onModuleInit(): void {
    this.push.wsBroadcast = (userIds, payload) => this.broadcast(userIds, payload);
  }

  attach(httpServer: import('node:http').Server): void {
    this.io = new Server(httpServer, { cors: { origin: '*' }, path: '/ws' });

    this.io.on('connection', (socket: Socket) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        socket.disconnect(true);
        return;
      }
      const userId = tokens.userId(token);
      if (!userId) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = userId;
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(socket.id);
      this.logger.log(`WS connected: ${userId} (${socket.id})`);

      socket.on('disconnect', () => {
        this.userSockets.get(userId)?.delete(socket.id);
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }
      });
    });
  }

  broadcast(userIds: string[], payload: CallPayload): void {
    if (!this.io) return;
    for (const userId of userIds) {
      const sockets = this.userSockets.get(userId);
      if (!sockets) continue;
      for (const sid of sockets) {
        this.io.to(sid).emit('call', payload);
      }
    }
  }
}
