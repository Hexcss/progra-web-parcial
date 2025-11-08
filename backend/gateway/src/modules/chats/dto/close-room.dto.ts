// src/modules/chats/dto/close-room.dto.ts
import { IsString } from 'class-validator';
export class CloseRoomDto {
  @IsString()
  roomId!: string;
}
