import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
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
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatsGateway.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly chats: ChatsService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`connect socket=${client.id} ip=${client.handshake.address}`);
    client.emit('support:connected', { ok: true });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`disconnect socket=${client.id}`);
  }

  @SubscribeMessage('support:subscribeMine')
  async subscribeMine(@ConnectedSocket() client: Socket) {
    try {
      const role = client.data?.user?.role as 'user' | 'admin' | undefined;
      const uid = client.data?.user?.sub as string | undefined;
      if (!uid) {
        this.logger.warn(`subscribeMine unauthorized socket=${client.id}`);
        throw new WsException('Unauthorized');
      }
      client.join(`user:${uid}`);
      if (role === 'admin') client.join('admins');
      this.logger.log(`subscribeMine ok uid=${uid} role=${role} socket=${client.id}`);
      return { ok: true };
    } catch (e: any) {
      this.logger.error(`subscribeMine error socket=${client.id} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:subscribe')
  async subscribe(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    try {
      if (!payload?.roomId) {
        this.logger.warn(`subscribe missing_roomId socket=${client.id}`);
        throw new WsException('roomId required');
      }
      client.join(`room:${payload.roomId}`);
      this.logger.log(`subscribe ok room=${payload.roomId} socket=${client.id}`);
      return { ok: true };
    } catch (e: any) {
      this.logger.error(`subscribe error socket=${client.id} room=${payload?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:unsubscribe')
  async unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    try {
      if (!payload?.roomId) {
        this.logger.warn(`unsubscribe missing_roomId socket=${client.id}`);
        throw new WsException('roomId required');
      }
      client.leave(`room:${payload.roomId}`);
      this.logger.log(`unsubscribe ok room=${payload.roomId} socket=${client.id}`);
      return { ok: true };
    } catch (e: any) {
      this.logger.error(`unsubscribe error socket=${client.id} room=${payload?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:create')
  async create(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto) {
    try {
      const uid = client.data.user.sub as string;
      this.logger.log(`create start uid=${uid} len=${dto?.initialMessage?.length ?? 0} socket=${client.id}`);
      const room = await this.chats.createRoom(uid, dto.initialMessage);
      client.join(`room:${room._id}`);
      this.server.to(`user:${uid}`).emit('support:room', { type: 'created', room });
      this.server.to('admins').emit('support:room', { type: 'created', room });
      this.logger.log(`create ok uid=${uid} room=${room._id}`);
      return { ok: true, room };
    } catch (e: any) {
      this.logger.error(`create error socket=${client.id} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:pickup')
  async pickup(@ConnectedSocket() client: Socket, @MessageBody() dto: PickupRoomDto) {
    try {
      const adminId = client.data.user.sub as string;
      this.logger.log(`pickup start admin=${adminId} room=${dto.roomId} socket=${client.id}`);
      const room = await this.chats.pickupRoom(adminId, dto.roomId);
      client.join(`room:${room._id}`);
      this.server.to(`room:${room._id}`).emit('support:room', { type: 'assigned', room });
      this.server.to('admins').emit('support:room', { type: 'assigned', room });
      this.server.to(`user:${room.customerId}`).emit('support:room', { type: 'assigned', room });
      this.logger.log(`pickup ok admin=${adminId} room=${room._id}`);
      return { ok: true, room };
    } catch (e: any) {
      this.logger.error(`pickup error socket=${client.id} room=${dto?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:send')
  async send(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    try {
      const uid = client.data.user.sub as string;
      const role = client.data.user.role as 'user' | 'admin';
      this.logger.log(`send start uid=${uid} role=${role} room=${dto.roomId} len=${dto.body?.length ?? 0} socket=${client.id}`);
      const msg = await this.chats.sendMessage(uid, role, dto.roomId, dto.body);
      const payload = { type: 'message', message: msg };
      this.server.to(`room:${dto.roomId}`).emit('support:message', payload);
      this.logger.log(`send ok uid=${uid} role=${role} room=${dto.roomId} msgId=${msg._id}`);
      return { ok: true, message: msg };
    } catch (e: any) {
      this.logger.error(`send error socket=${client.id} room=${dto?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:close')
  async close(@ConnectedSocket() client: Socket, @MessageBody() dto: CloseRoomDto) {
    try {
      const adminId = client.data.user.sub as string;
      this.logger.log(`close start admin=${adminId} room=${dto.roomId} socket=${client.id}`);
      const room = await this.chats.closeRoom(adminId, dto.roomId);
      this.server.to(`room:${dto.roomId}`).emit('support:room', { type: 'closed', room });
      this.server.to('admins').emit('support:room', { type: 'closed', room });
      this.server.to(`user:${room.customerId}`).emit('support:room', { type: 'closed', room });
      this.logger.log(`close ok admin=${adminId} room=${dto.roomId}`);
      return { ok: true, room };
    } catch (e: any) {
      this.logger.error(`close error socket=${client.id} room=${dto?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @UseGuards(WsAdminGuard)
  @SubscribeMessage('support:list')
  async list(@MessageBody() dto: ListRoomsDto) {
    try {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 20;
      this.logger.log(`list start status=${dto.status ?? 'any'} page=${page} limit=${limit}`);
      const res = await this.chats.listRooms(dto.status, page, limit);
      this.logger.log(`list ok status=${dto.status ?? 'any'} total=${res.total} page=${res.page} limit=${res.limit}`);
      return { ok: true, ...res };
    } catch (e: any) {
      this.logger.error(`list error msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:listMine')
  async listMine(@ConnectedSocket() client: Socket, @MessageBody() dto: { page?: number; limit?: number }) {
    try {
      const uid = client.data.user.sub as string;
      const role = client.data.user.role as 'user' | 'admin';
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 20;
      this.logger.log(`listMine start uid=${uid} role=${role} page=${page} limit=${limit}`);
      const res = await this.chats.listMyRooms(uid, role, page, limit);
      this.logger.log(`listMine ok uid=${uid} role=${role} total=${res.total} page=${res.page} limit=${res.limit}`);
      return { ok: true, ...res };
    } catch (e: any) {
      this.logger.error(`listMine error socket=${client.id} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }

  @SubscribeMessage('support:history')
  async history(@MessageBody() dto: { roomId: string; page?: number; limit?: number }) {
    try {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 50;
      this.logger.log(`history start room=${dto.roomId} page=${page} limit=${limit}`);
      const res = await this.chats.history(dto.roomId, page, limit);
      this.logger.log(`history ok room=${dto.roomId} count=${res.items.length} total=${res.total}`);
      return { ok: true, ...res };
    } catch (e: any) {
      this.logger.error(`history error room=${dto?.roomId} msg=${e?.message ?? 'unknown'}`);
      throw e instanceof WsException ? e : new WsException(e?.message ?? 'error');
    }
  }
}
