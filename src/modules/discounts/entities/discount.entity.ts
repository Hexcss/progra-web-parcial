import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'discounts' })
export class Discount {
  @ApiProperty({ type: String })
  _id: any;

  @ApiProperty({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @Prop({ required: true, min: 0, max: 100 })
  discountPercent!: number;

  @ApiProperty()
  @Prop({ required: true })
  startDate!: Date;

  @ApiProperty()
  @Prop({ required: true })
  endDate!: Date;
}

export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
DiscountSchema.index({ productId: 1, startDate: 1, endDate: 1 });
