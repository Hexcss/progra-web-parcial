import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  initialMessage?: string;
}
