import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class LoginDto {
  @Field()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @Field()
  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'strongpassword',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
