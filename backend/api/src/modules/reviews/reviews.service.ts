import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<Review>) {}

  async listByProduct(productId: string) {
    return this.reviewModel.find({ productId: new Types.ObjectId(productId) }).sort({ createdAt: -1 }).lean().exec();
  }

  async create(dto: CreateReviewDto, userId: string) {
    const created = new this.reviewModel({
      productId: new Types.ObjectId(dto.productId),
      userId: new Types.ObjectId(userId),
      score: dto.score,
      comment: dto.comment,
    });
    return created.save();
  }

  async update(id: string, dto: UpdateReviewDto) {
    const updated = await this.reviewModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Review not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Review not found');
    return { success: true };
  }
}
