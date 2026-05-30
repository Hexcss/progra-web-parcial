import { Field, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Field(() => ID)
  @ApiProperty({ type: String })
  _id: any;

  @Field()
  @ApiProperty()
  @Prop({ required: true, unique: true, trim: true, index: true })
  name!: string;

  @Field()
  @ApiProperty({ description: 'Lucide icon name' })
  @Prop({ required: true, trim: true })
  icon!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  @Field(() => Int, { nullable: true })
  productCount?: number;

  @Field(() => String, { nullable: true })
  thumbnail?: string | null;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ createdAt: 1 });
