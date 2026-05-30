import { Field, Float, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
@Schema({ timestamps: true, collection: 'discounts' })
export class Discount {
  @Field(() => ID)
  @ApiProperty({ type: String })
  _id: any;

  @Field(() => ID)
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Field(() => Float)
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @Prop({ required: true, min: 0, max: 100 })
  discountPercent!: number;

  @Field(() => GraphQLISODateTime)
  @ApiProperty()
  @Prop({ required: true })
  startDate!: Date;

  @Field(() => GraphQLISODateTime)
  @ApiProperty()
  @Prop({ required: true })
  endDate!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}

export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
DiscountSchema.index({ productId: 1, startDate: 1, endDate: 1 });
