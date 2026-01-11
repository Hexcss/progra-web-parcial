// src/schemas/auth.schemas.ts
import { z } from "zod";

const normalizeRole = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase() : value;

export const ZUserRole = z.preprocess(
  normalizeRole,
  z.enum(["user", "admin"])
);

export const ZUser = z.object({
  _id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  role: ZUserRole,
  createdAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type User = z.infer<typeof ZUser>;

export const ZSession = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: ZUserRole,
});
export type Session = z.infer<typeof ZSession>;
