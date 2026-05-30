// src/modules/discounts/discounts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Discount } from './entities/discount.entity';

@Injectable()
export class DiscountsService {
    constructor(@InjectModel(Discount.name) private readonly discountModel: Model<Discount>) { }

    async list(productId?: string) {
        const filter: any = {};
        if (productId) filter.productId = new Types.ObjectId(productId);
        return this.discountModel.find(filter).sort({ startDate: -1 }).lean().exec();
    }

    async getById(id: string) {
        const item = await this.discountModel.findById(id).lean().exec();
        if (!item) throw new NotFoundException('Discount not found');
        return item;
    }

    async create(dto: { productId: string; discountPercent: number; startDate: string; endDate: string }) {
        const created = new this.discountModel({
            productId: new Types.ObjectId(dto.productId),
            discountPercent: dto.discountPercent,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
        });
        return created.save();
    }

    async update(id: string, dto: Partial<{ productId: string; discountPercent: number; startDate: string; endDate: string }>) {
        const payload: any = { ...dto };
        if (dto.productId) payload.productId = new Types.ObjectId(dto.productId);
        if (dto.startDate) payload.startDate = new Date(dto.startDate);
        if (dto.endDate) payload.endDate = new Date(dto.endDate);
        const updated = await this.discountModel.findByIdAndUpdate(id, { $set: payload }, { new: true }).exec();
        if (!updated) throw new NotFoundException('Discount not found');
        return updated;
    }

    async remove(id: string) {
        const deleted = await this.discountModel.findByIdAndDelete(id).exec();
        if (!deleted) throw new NotFoundException('Discount not found');
        return { success: true };
    }

    async findActiveForProducts(productIds: Types.ObjectId[], now: Date) {
        const rows = await this.discountModel
            .aggregate([
                {
                    $match: {
                        productId: { $in: productIds },
                        startDate: { $lte: now },
                        endDate: { $gte: now },
                    },
                },
                {
                    $sort: { discountPercent: -1 },
                },
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
        return new Map<string, { discountPercent: number; startDate: Date; endDate: Date }>(
            rows.map(r => [String(r._id), { discountPercent: r.discountPercent, startDate: r.startDate, endDate: r.endDate }]),
        );
    }
}
