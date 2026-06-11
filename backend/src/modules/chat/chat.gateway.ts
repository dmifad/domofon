import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface SocketAuth {
  userId: string;
}

/**
 * WebSocket-чат жителя с УК. Клиент подключается с auth: { token: <JWT> },
 * вступает в комнату квартиры и получает события `message`.
 */
@WebSocketGateway({ namespace: '/ws/chat', cors: true })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chat: ChatService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new UnauthorizedException();
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access',
      });
      (client.data as SocketAuth).userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { apartmentId: string },
  ) {
    const { userId } = client.data as SocketAuth;
    await this.chat.assertApartmentAccess(userId, body.apartmentId);
    await client.join(this.room(body.apartmentId));
    return { joined: true };
  }

  @SubscribeMessage('message')
  async message(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { apartmentId: string; text: string },
  ) {
    const { userId } = client.data as SocketAuth;
    const text = (body.text ?? '').trim().slice(0, 4000);
    if (!text) return { error: 'empty_message' };

    const saved = await this.chat.send(userId, body.apartmentId, text);
    this.server.to(this.room(body.apartmentId)).emit('message', saved);
    return saved;
  }

  /** Используется диспетчерским интерфейсом УК (внутренний вызов). */
  broadcastToApartment(apartmentId: string, payload: unknown) {
    this.server.to(this.room(apartmentId)).emit('message', payload);
  }

  private room(apartmentId: string): string {
    return `apartment:${apartmentId}`;
  }
}
