// src/modules/orders/orders.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { EmailService } from '../../shared/email/email.service';
import { RoleLevel } from 'src/common/enums/role.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Discount.name) private readonly discountModel: Model<Discount>,
    private readonly emails: EmailService,
  ) {}

  async create(dto: CreateOrderDto, user: any) {
    if (!dto.items?.length) throw new BadRequestException('No items');
    const ids = dto.items.map((i) => new Types.ObjectId(i.productId));
    const session = await this.productModel.db.startSession();
    let created: any;

    await session.withTransaction(async () => {
      const products = await this.productModel.find({ _id: { $in: ids } }).session(session).lean().exec();
      if (products.length !== ids.length) throw new BadRequestException('Some products not found');

      const now = new Date();
      const discounts = await this.discountModel
        .aggregate([
          { $match: { productId: { $in: ids }, startDate: { $lte: now }, endDate: { $gte: now } } },
          { $sort: { discountPercent: -1 } },
          { $group: { _id: '$productId', discountPercent: { $first: '$discountPercent' }, startDate: { $first: '$startDate' }, endDate: { $first: '$endDate' } } },
        ])
        .session(session)
        .exec();

      const discountMap = new Map<string, number>(discounts.map((d) => [String(d._id), d.discountPercent]));
      const productMap = new Map<string, any>(products.map((p) => [String(p._id), p]));

      const orderItems: {
        productId: Types.ObjectId;
        name: string;
        imageUrl?: string;
        unitPrice: number;
        quantity: number;
        discountPercent?: number;
        lineTotal: number;
      }[] = [];

      let subtotal = 0;

      for (const item of dto.items) {
        const p = productMap.get(item.productId);
        if (!p) throw new BadRequestException('Product not found');

        const upd = await this.productModel.updateOne(
          { _id: new Types.ObjectId(item.productId), stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session },
        );
        if (upd.matchedCount === 0) throw new BadRequestException('Insufficient stock');

        const disc = discountMap.get(item.productId) || 0;
        const unitPrice = Math.round(p.price * (1 - disc / 100) * 100) / 100;
        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotal = Math.round((subtotal + lineTotal) * 100) / 100;

        orderItems.push({
          productId: new Types.ObjectId(item.productId),
          name: p.name,
          imageUrl: p.imageUrl,
          unitPrice,
          quantity: item.quantity,
          discountPercent: disc || undefined,
          lineTotal,
        });
      }

      const orderDoc = new this.orderModel({
        userId: new Types.ObjectId(user?.sub),
        items: orderItems,
        subtotal,
        total: subtotal,
        status: 'created',
        currency: dto.currency || 'EUR',
        email: user?.email,
      });

      created = await orderDoc.save({ session });
    });

    session.endSession();

    const emailStatus = await this.emails.sendOrderConfirmation({
      _id: created?._id,
      email: created?.email,
      items: created?.items ?? [],
      total: created?.total ?? 0,
    });

    return { ...(created?.toObject?.() ? created.toObject() : created), emailStatus };
  }

  async listAll(query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const [items, total] = await Promise.all([
      this.orderModel.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.orderModel.countDocuments().exec(),
    ]);
    return { items, total, page, limit };
  }

  async listMine(userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const [items, total] = await Promise.all([
      this.orderModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec(),
    ]);
    return { items, total, page, limit };
  }

  async getById(id: string, user: any) {
    const doc = await this.orderModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException('Order not found');

    const isAdmin =
      String(user?.role).toLowerCase() === 'admin' ||
      (Array.isArray(user?.roles) && user.roles.map((r: any) => String(r).toLowerCase()).includes('admin')) ||
      (typeof user?.roleLevel === 'number' && user.roleLevel >= RoleLevel.ADMIN);

    if (!isAdmin && String(doc.userId) !== String(user?.sub)) {
      throw new ForbiddenException();
    }
    return doc;
  }

  async updateStatus(id: string, dto: UpdateOrderDto) {
    const updated = await this.orderModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }
}
