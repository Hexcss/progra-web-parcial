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
    ) { }

    async list() {
        const items = await this.categoryModel.find().sort({ name: 1 }).lean().exec();
        const ids = items.map(i => i._id as Types.ObjectId);
        const counts = await this.productModel.aggregate([
            { $match: { categoryId: { $in: ids } } },
            { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        ]);
        const countMap = new Map<string, number>(counts.map(c => [String(c._id), c.count]));
        return items.map(i => ({ ...i, productCount: countMap.get(String(i._id)) ?? 0 }));
    }

    async getById(id: string) {
        const item = await this.categoryModel.findById(id).lean().exec();
        if (!item) throw new NotFoundException('Category not found');
        const productCount = await this.productModel.countDocuments({ categoryId: new Types.ObjectId(id) }).exec();
        return { ...item, productCount };
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
