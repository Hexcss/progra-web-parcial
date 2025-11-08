import { IsString } from 'class-validator';
export class PickupRoomDto {
  @IsString()
  roomId!: string;
}
