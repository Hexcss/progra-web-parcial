// src/modules/products/entities/product.entity.ts
import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ObjectType()
export class ActiveDiscount {
  @Field(() => Float)
  discountPercent!: number;

  @Field(() => GraphQLISODateTime)
  startDate!: Date;

  @Field(() => GraphQLISODateTime)
  endDate!: Date;
}

@ObjectType()
@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Field(() => ID)
  @ApiProperty({ type: String })
  _id: any;

  @Field()
  @ApiProperty()
  @Prop({ required: true, index: true })
  name!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  description?: string;

  @Field(() => Float)
  @ApiProperty()
  @Prop({ required: true })
  price!: number;

  @Field(() => Int)
  @ApiProperty()
  @Prop({ required: true, default: 0 })
  stock!: number;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop()
  imageUrl?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @Prop({ index: true })
  category?: string;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Category', index: true })
  categoryId?: Types.ObjectId;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ type: String })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  createdBy?: Types.ObjectId;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  @Field(() => Float, { nullable: true })
  avgRating?: number | null;

  @Field(() => Int, { nullable: true })
  reviewCount?: number;

  @Field(() => ActiveDiscount, { nullable: true })
  activeDiscount?: ActiveDiscount | null;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ createdAt: 1 });
