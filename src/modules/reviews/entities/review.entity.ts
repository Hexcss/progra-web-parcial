// src/modules/reviews/entities/review.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
    @ApiProperty({ type: String })
    _id: any;

    @ApiProperty({ type: String })
    @Prop({ type: SchemaTypes.ObjectId, ref: 'Product', required: true, index: true })
    productId!: Types.ObjectId;

    @ApiProperty({ type: String })
    @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
    userId!: Types.ObjectId;

    @ApiProperty({ minimum: 1, maximum: 5, example: 4.5 })
    @Prop({ required: true, min: 1, max: 5 })
    score!: number;

    @ApiPropertyOptional()
    @Prop()
    comment?: string;
}

export type ReviewDocument = HydratedDocument<Review>;
export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ productId: 1, userId: 1, createdAt: -1 });
