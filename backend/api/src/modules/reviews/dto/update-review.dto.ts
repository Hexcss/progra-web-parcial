// src/modules/reviews/dto/update-review.dto.ts
import { InputType, PartialType } from '@nestjs/graphql';
import { CreateReviewDto } from './create-review.dto';

@InputType()
export class UpdateReviewDto extends PartialType(CreateReviewDto) { }
