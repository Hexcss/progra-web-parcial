// src/modules/categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  private async sampleCategoryThumbnail(categoryObjectId: Types.ObjectId): Promise<string | null> {
    const filter = {
      categoryId: categoryObjectId,
      imageUrl: { $exists: true, $nin: [null, ''] },
    } as const;

    const total = await this.productModel.countDocuments(filter).exec();
    if (!total) return null;

    const skip = Math.floor(Math.random() * total);
    const doc = await this.productModel
      .findOne(filter)
      .skip(skip)
      .select({ _id: 0, imageUrl: 1 })
      .lean()
      .exec();

    return (doc as any)?.imageUrl ?? null;
  }

  async list() {
    const items = await this.categoryModel.find().sort({ name: 1 }).lean().exec();
    if (items.length === 0) return [];

    const ids = items.map((i) => i._id as Types.ObjectId);

    const counts = await this.productModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { categoryId: { $in: ids } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ])
      .exec();

    const countMap = new Map<string, number>(counts.map((c) => [String(c._id), c.count]));

    const thumbMap = new Map<string, string | null>();
    await Promise.all(
      ids.map(async (oid) => {
        const t = await this.sampleCategoryThumbnail(oid);
        thumbMap.set(String(oid), t);
      }),
    );

    return items.map((i) => ({
      ...i,
      productCount: countMap.get(String(i._id)) ?? 0,
      thumbnail: thumbMap.get(String(i._id)) ?? null,
    }));
  }

  async getById(id: string) {
    const item = await this.categoryModel.findById(id).lean().exec();
    if (!item) throw new NotFoundException('Category not found');

    const oid = new Types.ObjectId(id);
    const [productCount, thumbnail] = await Promise.all([
      this.productModel.countDocuments({ categoryId: oid }).exec(),
      this.sampleCategoryThumbnail(oid),
    ]);

    return { ...item, productCount, thumbnail };
  }

  async getNewThumbnail(id: string) {
    const exists = await this.categoryModel.exists({ _id: id });
    if (!exists) throw new NotFoundException('Category not found');

    const oid = new Types.ObjectId(id);
    const thumbnail = await this.sampleCategoryThumbnail(oid);
    return { categoryId: id, thumbnail };
  }

  async create(dto: CreateCategoryDto) {
    const created = new this.categoryModel(dto);
    return created.save();
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Category not found');
    return { success: true };
  }
}
