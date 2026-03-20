import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const searchSchema = paginationSchema.extend({
  search: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  type: z.enum(["FREE", "PAID"]).optional(),
  category: z.string().optional(),
  sortBy: z.enum(["date", "createdAt", "title"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
