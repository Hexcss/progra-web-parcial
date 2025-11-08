// src/modules/chats/schemas/chat-message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type SenderRole = 'user' | 'admin';

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage {
  _id: any;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ChatRoom', required: true, index: true })
  roomId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ type: String, enum: ['user', 'admin'], required: true })
  senderRole!: SenderRole;

  @Prop({ type: String, required: true })
  body!: string;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ createdAt: 1 });
