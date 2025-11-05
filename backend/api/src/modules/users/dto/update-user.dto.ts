// src/modules/users/dto/update-user.dto.ts
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Updated display name for the user',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'URL of the new avatar image',
    example: 'https://cdn.example.com/avatars/janedoe.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
