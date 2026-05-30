// backend/src/modules/reviews/reviews.service.ts
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RoleLevel } from '../../common/enums/role.enum';

type ObjectIdLike = string | Types.ObjectId;
const toObjectId = (v?: string) => (v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : null);

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<Review>) {}

  async listByProduct(productId: string, page = 1, limit = 10, userId?: string) {
    const pid = toObjectId(productId);
    if (!pid) return { items: [], total: 0, page, limit };

    const match: Record<string, any> = { productId: pid };
    const uid = toObjectId(userId);
    if (uid) match.userId = uid;

    const pipeline: PipelineStage[] = [
      { $match: match as Record<string, unknown> },
      { $sort: { createdAt: -1 as 1 | -1 } as any },
      {
        $facet: {
          items: [
            { $skip: Math.max(0, (page - 1) * limit) },
            { $limit: Math.max(1, Math.min(limit, 100)) },
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
          ],
          total: [{ $count: 'count' } as any],
        },
      } as any,
      {
        $project: {
          items: 1,
          total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
        },
      } as any,
    ];

    const [res] = await this.reviewModel.aggregate(pipeline).exec();
    return {
      items: res?.items ?? [],
      total: res?.total ?? 0,
      page,
      limit,
    };
  }

  private async getOneEnriched(id: ObjectIdLike) {
    const pipeline: PipelineStage[] = [
      { $match: { _id: typeof id === 'string' ? new Types.ObjectId(id) : id } },
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

  async create(dto: CreateReviewDto, userId: string) {
    const existing = await this.reviewModel.findOne({
      productId: new Types.ObjectId(dto.productId),
      userId: new Types.ObjectId(userId),
    });
    if (existing) throw new ConflictException('You already reviewed this product');

    try {
      const created = await this.reviewModel.create({
        productId: new Types.ObjectId(dto.productId),
        userId: new Types.ObjectId(userId),
        score: dto.score,
        comment: dto.comment,
      });
      const enriched = await this.getOneEnriched(created._id);
      return enriched ?? created;
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException('You already reviewed this product');
      throw e;
    }
  }

  async update(id: string, dto: UpdateReviewDto, actorId: string, actorRole: RoleLevel) {
    const doc = await this.reviewModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Review not found');
    const isOwner = doc.userId?.toString() === actorId;
    const isAdmin = actorRole === RoleLevel.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Cannot edit this review');

    const updated = await this.reviewModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    const enriched = await this.getOneEnriched(updated!._id);
    return enriched ?? updated;
  }

  async remove(id: string, actorId: string, actorRole: RoleLevel) {
    const doc = await this.reviewModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Review not found');
    const isOwner = doc.userId?.toString() === actorId;
    const isAdmin = actorRole === RoleLevel.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Cannot delete this review');

    await this.reviewModel.findByIdAndDelete(id).exec();
    return { success: true };
  }
}
