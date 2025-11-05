import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'strongpassword',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
