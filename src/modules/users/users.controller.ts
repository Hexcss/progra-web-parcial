// src/modules/users/users.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiCookieAuth('at')
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
  @UseGuards(AuthGuard('jwt'))
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
    };
  }

  @ApiCookieAuth('at')
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
  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.users['userModel']
      .findByIdAndUpdate(user.sub, { $set: dto }, { new: true })
      .select('_id email displayName role createdAt avatarUrl')
      .exec();
  }
}
