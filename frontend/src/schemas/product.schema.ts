import { z } from "zod";

export const ZProduct = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ZProduct>;
