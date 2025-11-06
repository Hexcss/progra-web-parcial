import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @ApiProperty({ type: String })
  _id: any;

  @ApiProperty()
  @Prop({ required: true, unique: true, trim: true, index: true })
  name!: string;

  @ApiProperty({ description: 'Lucide icon name' })
  @Prop({ required: true, trim: true })
  icon!: string;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ createdAt: 1 });
