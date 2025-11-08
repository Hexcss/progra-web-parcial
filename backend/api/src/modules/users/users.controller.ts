// src/modules/users/users.controller.ts
import { Controller, Get, Patch, Body, Param, ParseIntPipe, Query, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { MinRole } from '../../common/decorators/role.decorator';
import { Role, RoleLevel } from '../../common/enums/role.enum';
import { IsEnum, IsOptional } from 'class-validator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

class AdminCreateUserDto extends CreateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

class AdminUpdateUserDto extends UpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        displayName: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['user', 'admin'] },
        createdAt: { type: 'string', format: 'date-time' },
      },
      nullable: true,
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('me')
  async me(@CurrentUser() user: any) {
    const found = await this.users.findById(user.sub);
    if (!found) return null;
    return {
      _id: found._id,
      email: found.email,
      displayName: found.displayName,
      role: found.role,
      createdAt: (found as any).createdAt,
      avatarUrl: found.avatarUrl
    };
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        displayName: { type: 'string', nullable: true },
        role: { type: 'string', enum: ['user', 'admin'] },
        createdAt: { type: 'string', format: 'date-time' },
        avatarUrl: { type: 'string', format: 'uri', nullable: true },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch('me')
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ description: 'User list' })
  @MinRole(RoleLevel.ADMIN)
  @Get()
  async list(
    @Query('q') q?: string,
    @Query('role') role?: Role,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.users.list({ q, role, limit, page });
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get user by id (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @MinRole(RoleLevel.ADMIN)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create user (admin only)' })
  @ApiBody({ type: AdminCreateUserDto })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @MinRole(RoleLevel.ADMIN)
  @Post()
  async adminCreate(@Body() dto: AdminCreateUserDto) {
    return this.users.createUser(dto, dto.role ?? Role.USER);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiOkResponse({ description: 'User updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @MinRole(RoleLevel.ADMIN)
  @Patch(':id')
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.users.adminUpdateUser(id, dto);
  }

  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @MinRole(RoleLevel.ADMIN)
  @Delete(':id')
  async adminDelete(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
