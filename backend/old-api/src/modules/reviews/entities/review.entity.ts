// backend/src/modules/reviews/entities/review.entity.ts
import { Field, Float, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ObjectType()
export class ReviewUser {
  @Field(() => ID, { nullable: true })
  _id?: any;

  @Field(() => String, { nullable: true })
  displayName?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}

@ObjectType()
@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  @Field(() => ID)
  @ApiProperty({ type: String })
  _id: any;

  @Field(() => ID)
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Field(() => ID)
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Field(() => Float)
  @ApiProperty({ minimum: 1, maximum: 5, example: 4.5 })
  @Prop({ required: true, min: 1, max: 5 })
  score!: number;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  comment?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  @Field(() => ReviewUser, { nullable: true })
  user?: ReviewUser | null;
}

export type ReviewDocument = HydratedDocument<Review>;
export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, createdAt: -1 });
