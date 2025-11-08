// src/modules/orders/orders.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
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
  ApiBody,
} from '@nestjs/swagger';
import { MinRole } from '../../common/decorators/role.decorator';
import { RoleLevel } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create order from cart items' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Order created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.orders.create(dto, user);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List my orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ description: 'My orders' })
  @Get('my')
  async my(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.orders.listMine(user?.sub, { limit, page });
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List all orders (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ description: 'All orders' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @MinRole(RoleLevel.ADMIN)
  @Get()
  async list(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number
  ) {
    return this.orders.listAll({ limit, page });
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get order by id (admin or owner)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Order found' })
  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orders.getById(id, user);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkResponse({ description: 'Order updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @MinRole(RoleLevel.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orders.updateStatus(id, dto);
  }
}
