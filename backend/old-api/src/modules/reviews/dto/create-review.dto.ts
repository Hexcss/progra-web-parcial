// src/modules/reviews/dto/create-review.dto.ts
import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class CreateReviewDto {
  @Field(() => ID)
  @ApiProperty({ type: String })
  @IsMongoId()
  productId!: string;

  @Field(() => Float)
  @ApiProperty({ minimum: 1, maximum: 5, example: 4.5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  score!: number;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
