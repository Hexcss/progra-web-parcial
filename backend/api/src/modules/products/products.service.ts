// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Review } from '../reviews/entities/review.entity';
import { Discount } from '../discounts/entities/discount.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Discount.name) private readonly discountModel: Model<Discount>,
  ) {}

  async list(query: {
    q?: string;
    category?: string;
    categoryId?: string;
    limit?: number;
    page?: number;
    sort?: 'new' | 'priceAsc' | 'priceDesc' | 'rating';
  }) {
    const { q, category, categoryId, limit = 20, page = 1, sort = 'new' } = query;
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);

    const sortOption: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'priceAsc':
        sortOption.price = 1;
        break;
      case 'priceDesc':
        sortOption.price = -1;
        break;
      case 'rating':
        sortOption.avgRating = -1;
        sortOption.reviewCount = -1;
        break;
      case 'new':
      default:
        sortOption.createdAt = -1;
        break;
    }

    const now = new Date();
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews',
        },
      },
      {
        $lookup: {
          from: 'discounts',
          localField: '_id',
          foreignField: 'productId',
          as: 'discounts',
        },
      },
      {
        $addFields: {
          avgRating: { $ifNull: [{ $avg: '$reviews.score' }, null] },
          reviewCount: { $size: '$reviews' },
          activeDiscounts: {
            $filter: {
              input: '$discounts',
              as: 'd',
              cond: {
                $and: [{ $lte: ['$$d.startDate', now] }, { $gte: ['$$d.endDate', now] }],
              },
            },
          },
        },
      },
      {
        $addFields: {
          bestDiscount: { $max: '$activeDiscounts.discountPercent' },
        },
      },
      {
        $addFields: {
          activeDiscount: {
            $first: {
              $filter: {
                input: '$activeDiscounts',
                as: 'd',
                cond: { $eq: ['$$d.discountPercent', '$bestDiscount'] },
              },
            },
          },
        },
      },
      {
        $project: {
          reviews: 0,
          discounts: 0,
          activeDiscounts: 0,
          bestDiscount: 0,
        },
      },
      { $sort: sortOption },
    ];

    const paginatedPipeline: PipelineStage[] = [
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      {
        $project: {
          items: 1,
          total: { $arrayElemAt: ['$metadata.total', 0] },
        },
      },
    ];

    const result = await this.productModel.aggregate(paginatedPipeline).exec();
    const { items = [], total = 0 } = result[0] || {};

    return {
      total,
      page,
      limit,
      items: items.map((item) => ({
        ...item,
        avgRating: item.avgRating ? Number(item.avgRating.toFixed(2)) : null,
      })),
    };
  }

  async getById(id: string) {
    const item = await this.productModel.findById(id).lean().exec();
    if (!item) throw new NotFoundException('Product not found');

    const [ratingAgg, discountAgg] = await Promise.all([
      this.reviewModel
        .aggregate([
          { $match: { productId: new Types.ObjectId(id) } },
          { $group: { _id: '$productId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
        ])
        .exec(),
      this.discountModel
        .aggregate([
          {
            $match: {
              productId: new Types.ObjectId(id),
              startDate: { $lte: new Date() },
              endDate: { $gte: new Date() },
            },
          },
          { $sort: { discountPercent: -1 } },
          { $limit: 1 },
        ])
        .exec(),
    ]);

    const rating = ratingAgg[0] ? Number(ratingAgg[0].avg.toFixed(2)) : null;
    const reviewCount = ratingAgg[0]?.count ?? 0;
    const discount = discountAgg[0]
      ? {
          discountPercent: discountAgg[0].discountPercent,
          startDate: discountAgg[0].startDate,
          endDate: discountAgg[0].endDate,
        }
      : null;

    return { ...item, avgRating: rating, reviewCount, activeDiscount: discount };
  }

  async topRated(limit = 10) {
    const groups = await this.reviewModel
      .aggregate([
        { $group: { _id: '$productId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
        { $sort: { avg: -1, count: -1 } },
        { $limit: limit },
      ])
      .exec();

    if (groups.length === 0) return [];

    const ids = groups.map((g) => g._id as Types.ObjectId);
    const productDocs = await this.productModel
      .find({ _id: { $in: ids } })
      .lean()
      .exec();
    const productMap = new Map<string, any>(productDocs.map((p) => [String(p._id), p]));

    const now = new Date();
    const discounts = await this.discountModel
      .aggregate([
        {
          $match: {
            productId: { $in: ids },
            startDate: { $lte: now },
            endDate: { $gte: now },
          },
        },
        { $sort: { discountPercent: -1 } },
        {
          $group: {
            _id: '$productId',
            discountPercent: { $first: '$discountPercent' },
            startDate: { $first: '$startDate' },
            endDate: { $first: '$endDate' },
          },
        },
      ])
      .exec();
    const discountMap = new Map<string, { discountPercent: number; startDate: Date; endDate: Date }>(
      discounts.map((d) => [String(d._id), { discountPercent: d.discountPercent, startDate: d.startDate, endDate: d.endDate }]),
    );

    const ordered = groups
      .map((g) => {
        const prod = productMap.get(String(g._id));
        if (!prod) return null;
        const d = discountMap.get(String(g._id));
        return {
          ...prod,
          avgRating: Number(g.avg.toFixed(2)),
          reviewCount: g.count,
          activeDiscount: d ? { discountPercent: d.discountPercent, startDate: d.startDate, endDate: d.endDate } : null,
        };
      })
      .filter(Boolean);

    return ordered;
  }

  async create(dto: CreateProductDto, userId?: string) {
    const payload: any = { ...dto };
    if ((dto as any).categoryId) payload.categoryId = new Types.ObjectId((dto as any).categoryId);
    const created = new this.productModel({
      ...payload,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
    });
    return created.save();
  }

  async update(id: string, dto: UpdateProductDto) {
    const payload: any = { ...dto };
    if ((dto as any).categoryId) payload.categoryId = new Types.ObjectId((dto as any).categoryId);
    const updated = await this.productModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Product not found');
    return { success: true };
  }
}