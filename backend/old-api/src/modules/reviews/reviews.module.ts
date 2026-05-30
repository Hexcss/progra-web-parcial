import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './entities/review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsResolver } from './reviews.resolver';

@Module({
    imports: [MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }])],
    providers: [ReviewsService, ReviewsResolver],
    exports: [ReviewsService],
})
export class ReviewsModule { }
