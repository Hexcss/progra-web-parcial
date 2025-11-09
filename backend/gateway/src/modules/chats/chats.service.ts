import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { DiscordService } from '../discord/discord.service';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    @InjectModel(ChatRoom.name) private readonly roomModel: Model<ChatRoom>,
    @InjectModel(ChatMessage.name) private readonly msgModel: Model<ChatMessage>,
    private readonly discord: DiscordService,
  ) {}

  async createRoom(customerId: string, initialMessage?: string) {
    this.logger.log(`createRoom start customer=${customerId} len=${initialMessage?.length ?? 0}`);
    const room = await this.roomModel.create({ customerId: new Types.ObjectId(customerId), status: 'waiting' });
    const trimmed = initialMessage?.trim();
    if (trimmed) {
      await this.msgModel.create({
        roomId: room._id,
        senderId: new Types.ObjectId(customerId),
        senderRole: 'user',
        body: trimmed,
      });
      await this.roomModel.updateOne({ _id: room._id }, { $set: { lastMessageAt: new Date() } });
    }
    await this.discord.notifyNewSupportRoom({
      roomId: String(room._id),
      customerId: String(customerId),
      createdAt: room.lastMessageAt instanceof Date ? room.lastMessageAt : new Date(),
      initialMessage: trimmed,
    });
    this.logger.log(`createRoom ok room=${room._id}`);
    return room.toObject();
  }

  async pickupRoom(adminId: string, roomId: string) {
    this.logger.log(`pickupRoom start admin=${adminId} room=${roomId}`);
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      this.logger.warn(`pickupRoom not_found room=${roomId}`);
      throw new NotFoundException('Room not found');
    }
    if (room.status === 'closed') {
      this.logger.warn(`pickupRoom closed room=${roomId}`);
      throw new BadRequestException('Room closed');
    }
    if (room.adminId && String(room.adminId) !== String(adminId)) {
      this.logger.warn(`pickupRoom already_assigned room=${roomId} admin=${room.adminId}`);
      throw new ForbiddenException('Already assigned');
    }
    if (!room.adminId) {
      room.adminId = new Types.ObjectId(adminId);
      room.status = 'assigned';
      await room.save();
    }
    this.logger.log(`pickupRoom ok admin=${adminId} room=${roomId}`);
    return room.toObject();
  }

  async sendMessage(userId: string, role: 'user' | 'admin', roomId: string, body: string) {
    this.logger.log(`sendMessage start user=${userId} role=${role} room=${roomId} len=${body?.length ?? 0}`);
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      this.logger.warn(`sendMessage not_found room=${roomId}`);
      throw new NotFoundException('Room not found');
    }
    if (room.status === 'closed') {
      this.logger.warn(`sendMessage closed room=${roomId}`);
      throw new BadRequestException('Room closed');
    }
    if (role === 'user' && String(room.customerId) !== String(userId)) {
      this.logger.warn(`sendMessage forbidden user_not_owner room=${roomId} user=${userId}`);
      throw new ForbiddenException();
    }
    if (role === 'admin') {
      if (!room.adminId) {
        this.logger.warn(`sendMessage forbidden not_assigned room=${roomId} user=${userId}`);
        throw new ForbiddenException('Not assigned');
      }
      if (String(room.adminId) !== String(userId)) {
        this.logger.warn(`sendMessage forbidden not_your_assignment room=${roomId} user=${userId}`);
        throw new ForbiddenException('Not your assignment');
      }
    }
    const msg = await this.msgModel.create({
      roomId: room._id,
      senderId: new Types.ObjectId(userId),
      senderRole: role,
      body: body.trim(),
    });
    await this.roomModel.updateOne({ _id: room._id }, { $set: { lastMessageAt: new Date() } });
    this.logger.log(`sendMessage ok room=${roomId} msg=${msg._id}`);
    return msg.toObject();
  }

  async closeRoom(adminId: string, roomId: string) {
    this.logger.log(`closeRoom start admin=${adminId} room=${roomId}`);
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      this.logger.warn(`closeRoom not_found room=${roomId}`);
      throw new NotFoundException('Room not found');
    }
    if (!room.adminId || String(room.adminId) !== String(adminId)) {
      this.logger.warn(`closeRoom forbidden room=${roomId} admin=${adminId}`);
      throw new ForbiddenException();
    }
    if (room.status === 'closed') {
      this.logger.log(`closeRoom already_closed room=${roomId}`);
      return room.toObject();
    }
    room.status = 'closed';
    await room.save();
    this.logger.log(`closeRoom ok room=${roomId}`);
    return room.toObject();
  }

  async listRooms(status?: 'waiting' | 'assigned' | 'closed', page = 1, limit = 20) {
    this.logger.log(`listRooms start status=${status ?? 'any'} page=${page} limit=${limit}`);
    const q: any = {};
    if (status) q.status = status;
    const [items, total] = await Promise.all([
      this.roomModel
        .find(q)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.roomModel.countDocuments(q).exec(),
    ]);
    this.logger.log(`listRooms ok status=${status ?? 'any'} total=${total}`);
    return { items, total, page, limit };
  }

  async listMyRooms(userId: string, role: 'user' | 'admin', page = 1, limit = 20) {
    this.logger.log(`listMyRooms start user=${userId} role=${role} page=${page} limit=${limit}`);
    const q: any = role === 'user' ? { customerId: new Types.ObjectId(userId) } : { adminId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.roomModel
        .find(q)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.roomModel.countDocuments(q).exec(),
    ]);
    this.logger.log(`listMyRooms ok user=${userId} total=${total}`);
    return { items, total, page, limit };
  }

  async history(roomId: string, page = 1, limit = 50) {
    this.logger.log(`history start room=${roomId} page=${page} limit=${limit}`);
    const room = await this.roomModel.findById(roomId).lean();
    if (!room) {
      this.logger.warn(`history not_found room=${roomId}`);
      throw new NotFoundException('Room not found');
    }
    const [items, total] = await Promise.all([
      this.msgModel
        .find({ roomId: new Types.ObjectId(roomId) })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.msgModel.countDocuments({ roomId: new Types.ObjectId(roomId) }).exec(),
    ]);
    this.logger.log(`history ok room=${roomId} count=${items.length} total=${total}`);
    return { items, total, page, limit };
  }
}
