import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {}

  async list(query: { q?: string; category?: string; limit?: number; page?: number }) {
    const { q, category, limit = 20, page = 1 } = query;
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;

    const total = await this.productModel.countDocuments(filter).exec();
    const items = await this.productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    return { total, page, limit, items };
  }

  async getById(id: string) {
    const item = await this.productModel.findById(id).lean().exec();
    if (!item) throw new NotFoundException('Product not found');
    return item;
  }

  async create(dto: CreateProductDto, userId?: string) {
    const created = new this.productModel({
      ...dto,
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
    });
    return created.save();
  }

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.productModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Product not found');
    return { success: true };
  }
}
