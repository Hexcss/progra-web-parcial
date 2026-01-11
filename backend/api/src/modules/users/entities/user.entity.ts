// src/modules/users/entities/user.entity.ts
import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

@ObjectType()
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Field(() => ID)
  @ApiProperty({ description: 'Unique identifier', type: String })
  _id: any;

  @Field()
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

  @Field(() => Role)
  @ApiProperty({
    description: 'User role within the system',
    enum: Role,
    example: Role.USER,
  })
  @Prop({ enum: [Role.USER, Role.ADMIN], default: Role.USER, index: true })
  role!: Role;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    description: 'Display name of the user',
    example: 'Jane Doe',
  })
  @Prop()
  displayName?: string;

  @Field(() => String, { nullable: true })
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

  @Field(() => Boolean, { nullable: true })
  @ApiPropertyOptional({
    description: 'Whether the email is verified',
    example: false,
  })
  @Prop({ type: Boolean, default: false })
  emailVerified?: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ createdAt: 1 });
