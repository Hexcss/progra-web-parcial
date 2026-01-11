import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

@InputType()
export class AdminCreateUserDto extends CreateUserDto {
  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

@InputType()
export class AdminUpdateUserDto extends UpdateUserDto {
  @Field(() => Role, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
