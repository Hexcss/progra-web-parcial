// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { Discount, DiscountSchema } from '../discounts/entities/discount.entity';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from 'src/shared/email/email.module';

@Module({
    imports: [
        ConfigModule,
        EmailModule,
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Discount.name, schema: DiscountSchema },
        ]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
