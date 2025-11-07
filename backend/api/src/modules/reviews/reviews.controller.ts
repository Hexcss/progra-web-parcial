// backend/src/modules/reviews/reviews.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiBody } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { MinRole } from '../../common/decorators/role.decorator';
import { RoleLevel } from '../../common/enums/role.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @ApiOperation({ summary: 'List reviews by product' })
  @ApiQuery({ name: 'productId', type: String, required: true })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @ApiOkResponse({ description: 'List of reviews' })
  @Get()
  @Public()
  async list(
    @Query('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));
    return this.reviews.listByProduct(productId, p, l, userId);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create review (one per product)' })
  @ApiBody({ type: CreateReviewDto })
  @ApiCreatedResponse({ description: 'Review created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @MinRole(RoleLevel.USER)
  @Post()
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviews.create(dto, user?.sub);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update review (owner or admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReviewDto })
  @ApiOkResponse({ description: 'Review updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @MinRole(RoleLevel.USER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto, @CurrentUser() user: any) {
    return this.reviews.update(id, dto, user?.sub, user?.role);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete review (owner or admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Review deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @MinRole(RoleLevel.USER)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviews.remove(id, user?.sub, user?.role);
  }
}
