// src/modules/chats/chats.gateway.ts
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { PickupRoomDto } from './dto/pickup-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CloseRoomDto } from './dto/close-room.dto';
import { ListRoomsDto } from './dto/list-rooms.dto';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { WsAdminGuard } from 'src/common/guards/ws-admin.guard';

@UseGuards(WsAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@WebSocketGateway({
  namespace: '/support',
  cors: {
    origin: (origin, cb) => {
      cb(null, true);
    },
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(private readonly cfg: ConfigService, private readonly chats: ChatsService) {}

  async handleConnection(client: Socket) {
    const role = client.data?.user?.role;
    const uid = client.data?.user?.sub;
    client.join(`user:${uid}`);
    if (role === 'admin') client.join('admins');
  }

  async handleDisconnect(client: Socket) {}

  @SubscribeMessage('support:create')
  async create(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto) {
    const uid = client.data.user.sub as string;
    const room = await this.chats.createRoom(uid, dto.initialMessage);
    client.join(`room:${room._id}`);
    this.server.to('admins').emit('support:room', { type: 'created', room });
    return { ok: true, room };
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:pickup')
  async pickup(@ConnectedSocket() client: Socket, @MessageBody() dto: PickupRoomDto) {
    const adminId = client.data.user.sub as string;
    const room = await this.chats.pickupRoom(adminId, dto.roomId);
    client.join(`room:${room._id}`);
    this.server.to(`room:${room._id}`).emit('support:room', { type: 'assigned', room });
    return { ok: true, room };
  }

  @SubscribeMessage('support:send')
  async send(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    const uid = client.data.user.sub as string;
    const role = client.data.user.role as 'user' | 'admin';
    const msg = await this.chats.sendMessage(uid, role, dto.roomId, dto.body);
    const payload = { type: 'message', message: msg };
    this.server.to(`room:${dto.roomId}`).emit('support:message', payload);
    return { ok: true, message: msg };
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:close')
  async close(@ConnectedSocket() client: Socket, @MessageBody() dto: CloseRoomDto) {
    const adminId = client.data.user.sub as string;
    const room = await this.chats.closeRoom(adminId, dto.roomId);
    this.server.to(`room:${dto.roomId}`).emit('support:room', { type: 'closed', room });
    return { ok: true, room };
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:list')
  async list(@MessageBody() dto: ListRoomsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const res = await this.chats.listRooms(dto.status, page, limit);
    return { ok: true, ...res };
  }

  @SubscribeMessage('support:listMine')
  async listMine(@ConnectedSocket() client: Socket, @MessageBody() dto: { page?: number; limit?: number }) {
    const uid = client.data.user.sub as string;
    const role = client.data.user.role as 'user' | 'admin';
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const res = await this.chats.listMyRooms(uid, role, page, limit);
    return { ok: true, ...res };
  }

  @SubscribeMessage('support:history')
  async history(@MessageBody() dto: { roomId: string; page?: number; limit?: number }) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const res = await this.chats.history(dto.roomId, page, limit);
    return { ok: true, ...res };
  }
}
