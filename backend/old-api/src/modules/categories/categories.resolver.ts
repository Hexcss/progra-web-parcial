import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { RoleLevel } from 'src/common/enums/role.enum';
import { CategoryThumbnail, DeleteResponse } from 'src/common/graphql/types';

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Query(() => [Category])
  categories() {
    return this.categoriesService.list();
  }

  @Public()
  @Query(() => Category)
  category(@Args('id') id: string) {
    return this.categoriesService.getById(id);
  }

  @Query(() => CategoryThumbnail)
  categoryThumbnail(@Args('id') id: string) {
    return this.categoriesService.getNewThumbnail(id);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Category)
  createCategory(@Args('input') dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => Category)
  updateCategory(@Args('id') id: string, @Args('input') dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => DeleteResponse)
  removeCategory(@Args('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
