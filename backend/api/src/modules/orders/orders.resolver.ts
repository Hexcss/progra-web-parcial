import { Args, Int, Mutation, ObjectType, Query, Resolver, Field } from '@nestjs/graphql';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { RoleLevel } from 'src/common/enums/role.enum';

@ObjectType()
class PaginatedOrders {
  @Field(() => [Order])
  items!: Order[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;
}

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Mutation(() => Order)
  createOrder(@Args('input') dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user);
  }

  @Query(() => PaginatedOrders)
  myOrders(
    @CurrentUser() user: any,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ) {
    return this.ordersService.listMine(user?.sub, { limit, page });
  }

  @MinRole(RoleLevel.ADMIN)
  @Query(() => PaginatedOrders)
  orders(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ) {
    return this.ordersService.listAll({ limit, page });
  }

  @Query(() => Order)
  order(@Args('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getById(id, user);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Order)
  updateOrderStatus(@Args('id') id: string, @Args('input') dto: UpdateOrderDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
