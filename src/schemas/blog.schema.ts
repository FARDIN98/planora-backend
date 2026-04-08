import { z } from "zod";

export const createBlogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be between 3 and 200 characters")
    .max(200, "Title must be between 3 and 200 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  tags: z.string().optional().default(""),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
