import { IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  roomId!: string;

  @IsString()
  @MaxLength(5000)
  body!: string;
}
