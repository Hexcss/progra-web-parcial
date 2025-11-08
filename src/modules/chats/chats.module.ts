// src/modules/chats/chats.module.ts
import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatRoom, ChatRoomSchema } from './entities/chat-room.entity';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { WsAdminGuard } from 'src/common/guards/ws-admin.guard';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  providers: [ChatsGateway, ChatsService, WsAuthGuard, WsAdminGuard],
})
export class ChatsModule {}
