import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DiscountsService } from './discounts.service';
import { Discount } from './entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { RoleLevel } from 'src/common/enums/role.enum';
import { DeleteResponse } from 'src/common/graphql/types';

@Resolver(() => Discount)
export class DiscountsResolver {
  constructor(private readonly discountsService: DiscountsService) {}

  @Public()
  @Query(() => [Discount])
  discounts(
    @Args('productId', { nullable: true }) productId?: string,
    @Args('page', { type: () => Int, nullable: true }) _page?: number,
    @Args('limit', { type: () => Int, nullable: true }) _limit?: number,
  ) {
    return this.discountsService.list(productId);
  }

  @Public()
  @Query(() => Discount)
  discount(@Args('id') id: string) {
    return this.discountsService.getById(id);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Discount)
  createDiscount(@Args('input') dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Discount)
  updateDiscount(@Args('id') id: string, @Args('input') dto: UpdateDiscountDto) {
    return this.discountsService.update(id, dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => DeleteResponse)
  removeDiscount(@Args('id') id: string) {
    return this.discountsService.remove(id);
  }
}
