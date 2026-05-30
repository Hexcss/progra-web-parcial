// src/modules/orders/entities/order.entity.ts
import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailStatus } from '../../../common/graphql/types';

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Field()
  @ApiProperty()
  @Prop({ required: true })
  name!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  imageUrl?: string;

  @Field(() => Float)
  @ApiProperty()
  @Prop({ required: true })
  unitPrice!: number;

  @Field(() => Int)
  @ApiProperty()
  @Prop({ required: true })
  quantity!: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  discountPercent?: number;

  @Field(() => Float)
  @ApiProperty()
  @Prop({ required: true })
  lineTotal!: number;
}

@ObjectType()
@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Field(() => ID)
  @ApiProperty({ type: String })
  _id: any;

  @Field(() => ID)
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Field(() => [OrderItem])
  @ApiProperty({ type: [OrderItem] })
  @Prop({ type: [Object], required: true })
  items!: OrderItem[];

  @Field(() => Float)
  @ApiProperty()
  @Prop({ required: true })
  subtotal!: number;

  @Field(() => Float)
  @ApiProperty()
  @Prop({ required: true })
  total!: number;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop({ default: 'created', index: true })
  status?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  currency?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  email?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  @Field(() => EmailStatus, { nullable: true })
  emailStatus?: EmailStatus;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ createdAt: -1 });
