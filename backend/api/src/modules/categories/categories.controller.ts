// src/modules/categories/categories.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiParam,
    ApiCreatedResponse,
    ApiCookieAuth,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { MinRole } from '../../common/decorators/role.decorator';
import { RoleLevel } from '../../common/enums/role.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categories: CategoriesService) { }

    @ApiOperation({ summary: 'List categories with product count' })
    @ApiOkResponse({ description: 'List of categories' })
    @Get()
    async list() {
        return this.categories.list();
    }

    @ApiOperation({ summary: 'Get category by id with product count' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Category found' })
    @ApiNotFoundResponse({ description: 'Category not found' })
    @Get(':id')
    async get(@Param('id') id: string) {
        return this.categories.getById(id);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Create category (admin only)' })
    @ApiBody({ type: CreateCategoryDto })
    @ApiCreatedResponse({ description: 'Category created' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @MinRole(RoleLevel.ADMIN)
    @Post()
    async create(@Body() dto: CreateCategoryDto) {
        return this.categories.create(dto);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Update category (admin only)' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiOkResponse({ description: 'Category updated' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @ApiNotFoundResponse({ description: 'Category not found' })
    @MinRole(RoleLevel.ADMIN)
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categories.update(id, dto);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Delete category (admin only)' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Category deleted' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @ApiNotFoundResponse({ description: 'Category not found' })
    @MinRole(RoleLevel.ADMIN)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.categories.remove(id);
    }
}
