import { Args, Int, Mutation, ObjectType, Query, Resolver, Field } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { RoleLevel } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { DeleteResponse } from 'src/common/graphql/types';
import { NotFoundException } from '@nestjs/common';

@ObjectType()
class PaginatedReviews {
  @Field(() => [Review])
  items!: Review[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;
}

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(
    private readonly reviewsService: ReviewsService,
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
  ) {}

  @Public()
  @Query(() => PaginatedReviews)
  reviews(
    @Args('productId', { nullable: true }) productId?: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('userId', { nullable: true }) userId?: string,
  ) {
    const p = Math.max(1, Number(page ?? 1));
    const l = Math.min(100, Math.max(1, Number(limit ?? 10)));
    return this.reviewsService.listByProduct(productId ?? '', p, l, userId);
  }

  @Public()
  @Query(() => Review)
  async review(@Args('id') id: string) {
    const doc = await this.getOneEnriched(id);
    if (!doc) throw new NotFoundException('Review not found');
    return doc;
  }

  @MinRole(RoleLevel.USER)
  @Mutation(() => Review)
  createReview(@Args('input') dto: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviewsService.create(dto, user?.sub);
  }

  @MinRole(RoleLevel.USER)
  @Mutation(() => Review)
  updateReview(@Args('id') id: string, @Args('input') dto: UpdateReviewDto, @CurrentUser() user: any) {
    return this.reviewsService.update(id, dto, user?.sub, user?.role);
  }

  @MinRole(RoleLevel.USER)
  @Mutation(() => DeleteResponse)
  removeReview(@Args('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(id, user?.sub, user?.role);
  }

  private async getOneEnriched(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const pipeline: PipelineStage[] = [
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      } as any,
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          productId: 1,
          userId: 1,
          score: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: '$user._id',
            displayName: '$user.displayName',
            email: '$user.email',
            avatarUrl: '$user.avatarUrl',
          },
        },
      } as any,
    ];

    const [doc] = await this.reviewModel.aggregate(pipeline).exec();
    return doc ?? null;
  }
}
