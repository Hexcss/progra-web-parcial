import { SetMetadata } from '@nestjs/common';
import { RoleLevel } from '../enums/role.enum';

export const MIN_ROLE_KEY = 'minRole';

export const MinRole = (level: RoleLevel) => SetMetadata(MIN_ROLE_KEY, level);
