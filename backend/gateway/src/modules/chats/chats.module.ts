import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';
import { ChatRoom, ChatRoomSchema } from './entities/chat-room.entity';
import { ChatMessage, ChatMessageSchema } from './entities/chat-message.entity';
import { WsAuthGuard } from 'src/common/guards/ws-auth.guard';
import { WsAdminGuard } from 'src/common/guards/ws-admin.guard';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    forwardRef(() => AuthModule),
    DiscordModule,
  ],
  providers: [ChatsGateway, ChatsService, WsAuthGuard, WsAdminGuard],
  exports: [ChatsService],
})
export class ChatsModule {}
