// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
  ) { }

  async list(query: { q?: string; category?: string; categoryId?: string; limit?: number; page?: number }) {
    const { q, category, categoryId, limit = 20, page = 1 } = query;
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);

    const total = await this.productModel.countDocuments(filter).exec();
    const items = await this.productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const ids = items.map((i) => i._id as Types.ObjectId);
    const now = new Date();

    const ratings = await this.reviewModel
      .aggregate([
        { $match: { productId: { $in: ids } } },
        { $group: { _id: '$productId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
      ])
      .exec();
    const ratingMap = new Map<string, { avg: number; count: number }>(
      ratings.map((r) => [String(r._id), { avg: r.avg, count: r.count }]),
    );

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

    const enriched = items.map((i) => {
      const r = ratingMap.get(String(i._id));
      const d = discountMap.get(String(i._id));
      return {
        ...i,
        avgRating: r ? Number(r.avg.toFixed(2)) : null,
        reviewCount: r?.count ?? 0,
        activeDiscount: d ? { discountPercent: d.discountPercent, startDate: d.startDate, endDate: d.endDate } : null,
      };
    });

    return { total, page, limit, items: enriched };
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
      ? { discountPercent: discountAgg[0].discountPercent, startDate: discountAgg[0].startDate, endDate: discountAgg[0].endDate }
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
