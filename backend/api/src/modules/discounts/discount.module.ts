import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Discount, DiscountSchema } from './entities/discount.entity';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Discount.name, schema: DiscountSchema }])],
    controllers: [DiscountsController],
    providers: [DiscountsService],
    exports: [DiscountsService],
})
export class DiscountsModule { }
