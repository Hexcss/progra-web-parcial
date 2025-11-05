// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password for the account (minimum 6 characters)',
    example: 'securePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description: 'Display name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}
