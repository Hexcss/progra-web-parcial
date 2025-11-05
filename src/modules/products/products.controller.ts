// src/modules/products/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @ApiOperation({ summary: 'List products' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ description: 'List of products' })
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.products.list({ q, category, limit, page });
  }

  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Product found' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.products.getById(id);
  }

  @ApiCookieAuth('at')
  @ApiOperation({ summary: 'Create product (admin only)' })
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({ description: 'Product created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.products.create(dto, user?.sub);
  }

  @ApiCookieAuth('at')
  @ApiOperation({ summary: 'Update product (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProductDto })
  @ApiOkResponse({ description: 'Product updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @ApiCookieAuth('at')
  @ApiOperation({ summary: 'Delete product (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Product deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
