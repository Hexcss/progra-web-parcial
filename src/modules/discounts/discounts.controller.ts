import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
    ApiBody,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { MinRole } from '../../common/decorators/role.decorator';
import { RoleLevel } from '../../common/enums/role.enum';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@ApiTags('discounts')
@Controller('discounts')
export class DiscountsController {
    constructor(private readonly discounts: DiscountsService) { }

    @ApiOperation({ summary: 'List discounts' })
    @ApiQuery({ name: 'productId', required: false, type: String })
    @ApiOkResponse({ description: 'List of discounts' })
    @Get()
    async list(@Query('productId') productId?: string) {
        return this.discounts.list(productId);
    }

    @ApiOperation({ summary: 'Get discount by id' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Discount found' })
    @ApiNotFoundResponse({ description: 'Discount not found' })
    @Get(':id')
    async get(@Param('id') id: string) {
        return this.discounts.getById(id);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Create discount (admin only)' })
    @ApiBody({ type: CreateDiscountDto })
    @ApiCreatedResponse({ description: 'Discount created' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @MinRole(RoleLevel.ADMIN)
    @Post()
    async create(@Body() dto: CreateDiscountDto) {
        return this.discounts.create(dto);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Update discount (admin only)' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdateDiscountDto })
    @ApiOkResponse({ description: 'Discount updated' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @ApiNotFoundResponse({ description: 'Discount not found' })
    @MinRole(RoleLevel.ADMIN)
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
        return this.discounts.update(id, dto);
    }

    @ApiCookieAuth('accessToken')
    @ApiOperation({ summary: 'Delete discount (admin only)' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Discount deleted' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden' })
    @ApiNotFoundResponse({ description: 'Discount not found' })
    @MinRole(RoleLevel.ADMIN)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.discounts.remove(id);
    }
}
