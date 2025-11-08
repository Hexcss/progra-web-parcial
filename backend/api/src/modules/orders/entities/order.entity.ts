// src/modules/orders/entities/order.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItem {
  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  name!: string;

  @ApiPropertyOptional()
  @Prop()
  imageUrl?: string;

  @ApiProperty()
  @Prop({ required: true })
  unitPrice!: number;

  @ApiProperty()
  @Prop({ required: true })
  quantity!: number;

  @ApiPropertyOptional()
  @Prop()
  discountPercent?: number;

  @ApiProperty()
  @Prop({ required: true })
  lineTotal!: number;
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @ApiProperty({ type: String })
  _id: any;

  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @ApiProperty({ type: [OrderItem] })
  @Prop({ type: [Object], required: true })
  items!: OrderItem[];

  @ApiProperty()
  @Prop({ required: true })
  subtotal!: number;

  @ApiProperty()
  @Prop({ required: true })
  total!: number;

  @ApiPropertyOptional()
  @Prop({ default: 'created', index: true })
  status?: string;

  @ApiPropertyOptional()
  @Prop()
  currency?: string;

  @ApiPropertyOptional()
  @Prop()
  email?: string;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ createdAt: -1 });
