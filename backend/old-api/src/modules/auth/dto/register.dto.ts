import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class RegisterDto {
  @Field()
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @Field()
  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'supersecret',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @Field()
  @ApiProperty({
    description: 'Display name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  displayName!: string;
}
