// src/modules/users/entities/user.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @ApiProperty({ description: 'Unique identifier', type: String })
  _id: any;

  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'user@example.com',
  })
  @Prop({ unique: true, required: true, index: true })
  email!: string;

  @ApiProperty({
    description: 'Hashed password (stored securely)',
    example: '$argon2id$v=19$m=19456,t=2,p=1$...',
  })
  @Prop({ required: true })
  passwordHash!: string;

  @ApiProperty({
    description: 'User role within the system',
    enum: Role,
    example: Role.USER,
  })
  @Prop({ enum: [Role.USER, Role.ADMIN], default: Role.USER, index: true })
  role!: Role;

  @ApiPropertyOptional({
    description: 'Display name of the user',
    example: 'Jane Doe',
  })
  @Prop()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'URL of the user’s avatar image',
    example: 'https://cdn.example.com/avatars/user123.jpg',
  })
  @Prop()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Hashed refresh token (for persistent sessions)',
    example: '$argon2id$v=19$m=19456,t=2,p=1$...',
  })
  @Prop()
  refreshTokenHash?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ createdAt: 1 });
