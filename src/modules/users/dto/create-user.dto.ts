// src/modules/users/dto/create-user.dto.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class CreateUserDto {
  @Field()
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @Field()
  @ApiProperty({
    description: 'Password for the account (minimum 6 characters)',
    example: 'securePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    description: 'Display name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}
