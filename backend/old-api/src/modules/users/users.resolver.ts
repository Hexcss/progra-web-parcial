import { Args, Int, Mutation, ObjectType, Query, Resolver, Field } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/admin-user.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { MinRole } from 'src/common/decorators/role.decorator';
import { Role, RoleLevel } from 'src/common/enums/role.enum';
import { DeleteResponse } from 'src/common/graphql/types';

@ObjectType()
class PaginatedUsers {
  @Field(() => [User])
  items!: User[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;
}

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { nullable: true })
  async me(@CurrentUser() user: any) {
    const found = await this.usersService.findById(user?.sub);
    if (!found) return null;
    return {
      _id: found._id,
      email: found.email,
      displayName: found.displayName,
      role: found.role,
      createdAt: (found as any).createdAt,
      updatedAt: (found as any).updatedAt,
      avatarUrl: (found as any).avatarUrl,
      emailVerified: (found as any).emailVerified,
    };
  }

  @Mutation(() => User)
  updateProfile(@CurrentUser() user: any, @Args('input') dto: UpdateUserDto) {
    return this.usersService.updateProfile(user?.sub, dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Query(() => PaginatedUsers)
  users(
    @Args('q', { nullable: true }) q?: string,
    @Args('role', { type: () => Role, nullable: true }) role?: Role,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
  ) {
    return this.usersService.list({ q, role, limit, page });
  }

  @MinRole(RoleLevel.ADMIN)
  @Query(() => User, { nullable: true })
  user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => User)
  createUser(@Args('input') dto: AdminCreateUserDto) {
    return this.usersService.createUser(dto, dto.role ?? Role.USER);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => User)
  updateUser(@Args('id') id: string, @Args('input') dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @MinRole(RoleLevel.ADMIN)
  @Mutation(() => DeleteResponse)
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }
}
