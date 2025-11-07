// src/schemas/auth.schemas.ts
import { z } from "zod";

export const ZUserRole = z.enum(["user", "admin"]);

export const ZUser = z.object({
  _id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  role: ZUserRole,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  avatarUrl: z.string().url().optional(),
});
export type User = z.infer<typeof ZUser>;

export const ZSession = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: ZUserRole,
});
export type Session = z.infer<typeof ZSession>;
