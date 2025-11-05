// src/modules/products/entities/product.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @ApiProperty({ description: 'Unique identifier', type: String })
  _id: any;

  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Headphones',
  })
  @Prop({ required: true, index: true })
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: 'Noise-cancelling Bluetooth headphones with long battery life.',
  })
  @Prop()
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 129.99,
    minimum: 0,
  })
  @Prop({ required: true })
  price!: number;

  @ApiProperty({
    description: 'Units in stock',
    example: 100,
  })
  @Prop({ required: true, default: 0 })
  stock!: number;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://cdn.example.com/images/headphones.jpg',
  })
  @Prop()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Electronics',
  })
  @Prop({ index: true })
  category?: string;

  @ApiPropertyOptional({
    description: 'Tags used for product search and filtering',
    example: ['wireless', 'bluetooth', 'audio'],
    type: [String],
  })
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @ApiPropertyOptional({
    description: 'User who created the product',
    type: String,
  })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ createdAt: 1 });
