// src/modules/chats/schemas/chat-room.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ChatRoomStatus = 'waiting' | 'assigned' | 'closed';

@Schema({ timestamps: true, collection: 'chat_rooms' })
export class ChatRoom {
  _id: any;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: false, index: true })
  adminId?: Types.ObjectId;

  @Prop({ type: String, enum: ['waiting', 'assigned', 'closed'], default: 'waiting', index: true })
  status!: ChatRoomStatus;

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date;
}

export type ChatRoomDocument = HydratedDocument<ChatRoom>;
export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
ChatRoomSchema.index({ updatedAt: -1 });
