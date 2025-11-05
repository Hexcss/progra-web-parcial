export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export enum RoleLevel {
	ADMIN = 100,
	USER = 10,
}

export const RoleLevelMap: Record<Role, RoleLevel> = {
	user: RoleLevel.USER,
	admin: RoleLevel.ADMIN,
};

export const getLevelFromRole = (roleString: Role): RoleLevel | undefined => {
	return RoleLevelMap[roleString];
};