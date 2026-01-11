// src/backend/apis/users.api.ts
import { z } from "zod";
import { graphqlRequest } from "../clients/graphql.client";
import { safeApiCall, type SafeApiResult } from "../../utils/functions/safe-api-call.function";
import { ZUser, ZUserRole, type User } from "../../schemas/auth.schemas";

const ZUserListParams = z.object({
  q: z.string().optional(),
  role: ZUserRole.optional(),
  limit: z.number().int().positive().max(100).optional(),
  page: z.number().int().positive().optional(),
});
export type UserListParams = z.infer<typeof ZUserListParams>;

const ZPaginatedUsers = z.object({
  items: z.array(ZUser),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type PaginatedUsers = z.infer<typeof ZPaginatedUsers>;

const ZUpdateProfilePayload = z.object({
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateProfileInput = z.infer<typeof ZUpdateProfilePayload>;

const ZCreateUserPayload = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  role: ZUserRole.optional(),
  avatarUrl: z.string().url().optional(),
  password: z.string(),
});
export type CreateUserInput = z.infer<typeof ZCreateUserPayload>;

const ZAdminUpdateUserPayload = z.object({
  displayName: z.string().optional(),
  role: ZUserRole.optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateUserInput = z.infer<typeof ZAdminUpdateUserPayload>;

const toGqlRole = (role?: string) => (role ? role.toUpperCase() : undefined);

const USER_FIELDS = `
  _id
  email
  displayName
  role
  createdAt
  updatedAt
  avatarUrl
  emailVerified
`;

const ME_QUERY = `
  query Me {
    me {
      ${USER_FIELDS}
    }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateUserDto!) {
    updateProfile(input: $input) {
      ${USER_FIELDS}
    }
  }
`;

const LIST_QUERY = `
  query Users($q: String, $role: Role, $limit: Int, $page: Int) {
    users(q: $q, role: $role, limit: $limit, page: $page) {
      items { ${USER_FIELDS} }
      total
      page
      limit
    }
  }
`;

const GET_QUERY = `
  query User($id: String!) {
    user(id: $id) {
      ${USER_FIELDS}
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateUser($input: AdminCreateUserDto!) {
    createUser(input: $input) {
      ${USER_FIELDS}
    }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdateUser($id: String!, $input: AdminUpdateUserDto!) {
    updateUser(id: $id, input: $input) {
      ${USER_FIELDS}
    }
  }
`;

const REMOVE_MUTATION = `
  mutation RemoveUser($id: String!) {
    removeUser(id: $id) {
      success
    }
  }
`;

export const UsersAPI = {
  async getProfile(): Promise<SafeApiResult<User | null>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ me: User | null }>(ME_QUERY);
      if (!data.me) return null;
      return ZUser.parse(data.me);
    });
  },

  async updateProfile(input: UpdateProfileInput): Promise<SafeApiResult<User>> {
    const parsed = ZUpdateProfilePayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ updateProfile: User }>(UPDATE_PROFILE_MUTATION, { input: parsed.data });
      return ZUser.parse(data.updateProfile);
    });
  },

  async list(params: UserListParams = {}): Promise<SafeApiResult<PaginatedUsers>> {
    const parsed = ZUserListParams.safeParse(params);
    const finalParams = parsed.success ? parsed.data : {};
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ users: PaginatedUsers }>(LIST_QUERY, {
        ...finalParams,
        role: toGqlRole(finalParams.role as string | undefined),
      });
      return ZPaginatedUsers.parse(data.users);
    });
  },

  async getById(id: string): Promise<SafeApiResult<User | null>> {
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ user: User | null }>(GET_QUERY, { id });
      if (!data.user) return null;
      return ZUser.parse(data.user);
    });
  },

  async create(input: CreateUserInput): Promise<SafeApiResult<User>> {
    const parsed = ZCreateUserPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ createUser: User }>(CREATE_MUTATION, {
        input: {
          ...parsed.data,
          role: toGqlRole(parsed.data.role as string | undefined),
        },
      });
      return ZUser.parse(data.createUser);
    });
  },

  async update(id: string, input: UpdateUserInput): Promise<SafeApiResult<User>> {
    const parsed = ZAdminUpdateUserPayload.safeParse(input);
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return { success: false, message: m, status: null, data: null };
    }
    return safeApiCall(async () => {
      const data = await graphqlRequest<{ updateUser: User }>(UPDATE_MUTATION, {
        id,
        input: {
          ...parsed.data,
          role: toGqlRole(parsed.data.role as string | undefined),
        },
      });
      return ZUser.parse(data.updateUser);
    });
  },

  async remove(id: string): Promise<SafeApiResult<true>> {
    return safeApiCall(async () => {
      await graphqlRequest<{ removeUser: { success: boolean } }>(REMOVE_MUTATION, { id });
      return true as const;
    });
  },
};
