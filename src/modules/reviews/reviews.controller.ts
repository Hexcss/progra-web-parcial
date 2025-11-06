// src/modules/reviews/reviews.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse, ApiBody } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { MinRole } from '../../common/decorators/role.decorator';
import { RoleLevel } from '../../common/enums/role.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @ApiOperation({ summary: 'List reviews by product' })
  @ApiQuery({ name: 'productId', type: String, required: true })
  @ApiOkResponse({ description: 'List of reviews' })
  @Get()
  async list(@Query('productId') productId: string) {
    return this.reviews.listByProduct(productId);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create review (authenticated users)' })
  @ApiBody({ type: CreateReviewDto })
  @ApiCreatedResponse({ description: 'Review created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @MinRole(RoleLevel.USER)
  @Post()
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: any) {
    return this.reviews.create(dto, user?.sub);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update review (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateReviewDto })
  @ApiOkResponse({ description: 'Review updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @MinRole(RoleLevel.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(id, dto);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete review (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Review deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @MinRole(RoleLevel.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }
}
