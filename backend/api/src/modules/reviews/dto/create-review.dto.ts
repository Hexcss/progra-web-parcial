// src/modules/reviews/dto/create-review.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 4.5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
