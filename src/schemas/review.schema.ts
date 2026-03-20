import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer between 1 and 5")
    .min(1, "Rating must be an integer between 1 and 5")
    .max(5, "Rating must be an integer between 1 and 5"),
  comment: z
    .string()
    .min(10, "Review must be between 10 and 500 characters")
    .max(500, "Review must be between 10 and 500 characters"),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer between 1 and 5")
    .min(1, "Rating must be an integer between 1 and 5")
    .max(5, "Rating must be an integer between 1 and 5")
    .optional(),
  comment: z
    .string()
    .min(10, "Review must be between 10 and 500 characters")
    .max(500, "Review must be between 10 and 500 characters")
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
