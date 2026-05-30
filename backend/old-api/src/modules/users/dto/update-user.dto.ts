// src/modules/users/dto/update-user.dto.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class UpdateUserDto {
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    description: 'Updated display name for the user',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    description: 'URL of the new avatar image',
    example: 'https://cdn.example.com/avatars/janedoe.jpg',
    format: 'uri',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
