import { Args, Float, Int, Mutation, ObjectType, Query, Resolver, Field } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { RoleLevel } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { DeleteResponse } from 'src/common/graphql/types';

@ObjectType()
class PaginatedProducts {
  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => [Product])
  items!: Product[];
}

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Query(() => PaginatedProducts)
  products(
    @Args('q', { nullable: true }) q?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('categoryId', { nullable: true }) categoryId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('tags', { type: () => [String], nullable: true }) _tags?: string[],
    @Args('minPrice', { type: () => Float, nullable: true }) _minPrice?: number,
    @Args('maxPrice', { type: () => Float, nullable: true }) _maxPrice?: number,
    @Args('sort', { nullable: true }) sort?: 'new' | 'priceAsc' | 'priceDesc' | 'rating',
  ) {
    return this.productsService.list({ q, category, categoryId, limit, page, sort });
  }

  @Public()
  @Query(() => [Product])
  topProducts(@Args('limit', { type: () => Int, nullable: true }) limit?: number) {
    return this.productsService.topRated(limit ?? 10);
  }

  @Public()
  @Query(() => Product)
  product(@Args('id') id: string) {
    return this.productsService.getById(id);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Product)
  createProduct(@Args('input') dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user?.sub);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Product)
  updateProduct(@Args('id') id: string, @Args('input') dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => DeleteResponse)
  removeProduct(@Args('id') id: string) {
    return this.productsService.remove(id);
  }
}
