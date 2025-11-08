// src/modules/chats/chats.service.ts
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(ChatRoom.name) private readonly roomModel: Model<ChatRoom>,
    @InjectModel(ChatMessage.name) private readonly msgModel: Model<ChatMessage>,
  ) {}

  async createRoom(customerId: string, initialMessage?: string) {
    const room = await this.roomModel.create({ customerId: new Types.ObjectId(customerId), status: 'waiting' });
    if (initialMessage?.trim()) {
      await this.msgModel.create({
        roomId: room._id,
        senderId: new Types.ObjectId(customerId),
        senderRole: 'user',
        body: initialMessage.trim(),
      });
      await this.roomModel.updateOne({ _id: room._id }, { $set: { lastMessageAt: new Date() } });
    }
    return room;
  }

  async pickupRoom(adminId: string, roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'closed') throw new BadRequestException('Room closed');
    if (room.adminId && String(room.adminId) !== String(adminId)) {
      throw new ForbiddenException('Already assigned');
    }
    if (!room.adminId) {
      room.adminId = new Types.ObjectId(adminId);
      room.status = 'assigned';
      await room.save();
    }
    return room.toObject();
  }

  async sendMessage(userId: string, role: 'user' | 'admin', roomId: string, body: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'closed') throw new BadRequestException('Room closed');
    if (role === 'user' && String(room.customerId) !== String(userId)) throw new ForbiddenException();
    if (role === 'admin') {
      if (!room.adminId) throw new ForbiddenException('Not assigned');
      if (String(room.adminId) !== String(userId)) throw new ForbiddenException('Not your assignment');
    }
    const msg = await this.msgModel.create({
      roomId: room._id,
      senderId: new Types.ObjectId(userId),
      senderRole: role,
      body: body.trim(),
    });
    await this.roomModel.updateOne({ _id: room._id }, { $set: { lastMessageAt: new Date() } });
    return msg.toObject();
  }

  async closeRoom(adminId: string, roomId: string) {
    const room = await this.roomModel.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (!room.adminId || String(room.adminId) !== String(adminId)) throw new ForbiddenException();
    if (room.status === 'closed') return room.toObject();
    room.status = 'closed';
    await room.save();
    return room.toObject();
  }

  async listRooms(status?: 'waiting' | 'assigned' | 'closed', page = 1, limit = 20) {
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
    return { items, total, page, limit };
  }

  async listMyRooms(userId: string, role: 'user' | 'admin', page = 1, limit = 20) {
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
    return { items, total, page, limit };
  }

  async history(roomId: string, page = 1, limit = 50) {
    const room = await this.roomModel.findById(roomId).lean();
    if (!room) throw new NotFoundException('Room not found');
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
    return { items, total, page, limit };
  }
}
