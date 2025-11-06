// src/modules/products/entities/product.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @ApiProperty({ type: String })
  _id: any;

  @ApiProperty()
  @Prop({ required: true, index: true })
  name!: string;

  @ApiPropertyOptional()
  @Prop()
  description?: string;

  @ApiProperty()
  @Prop({ required: true })
  price!: number;

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  stock!: number;

  @ApiPropertyOptional()
  @Prop()
  imageUrl?: string;

  @ApiPropertyOptional()
  @Prop({ index: true })
  category?: string;

  @ApiPropertyOptional({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', index: true })
  categoryId?: Types.ObjectId;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @ApiPropertyOptional({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ createdAt: 1 });
