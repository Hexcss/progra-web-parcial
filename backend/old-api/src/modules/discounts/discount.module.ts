import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Discount, DiscountSchema } from './entities/discount.entity';
import { DiscountsService } from './discounts.service';
import { DiscountsResolver } from './discounts.resolver';

@Module({
    imports: [MongooseModule.forFeature([{ name: Discount.name, schema: DiscountSchema }])],
    providers: [DiscountsService, DiscountsResolver],
    exports: [DiscountsService],
})
export class DiscountsModule { }
