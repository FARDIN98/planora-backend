import { z } from "zod";

const eventBaseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be between 3 and 200 characters")
    .max(200, "Title must be between 3 and 200 characters"),
  description: z
    .string()
    .min(10, "Description must be between 10 and 2000 characters")
    .max(2000, "Description must be between 10 and 2000 characters"),
  date: z.string().datetime("Date must be a valid ISO 8601 date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  venue: z
    .string()
    .min(3, "Venue must be between 3 and 200 characters")
    .max(200, "Venue must be between 3 and 200 characters"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  type: z.enum(["FREE", "PAID"]).default("FREE"),
  fee: z.number().min(0).default(0),
  category: z.string().max(50).default("General"),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => !(data.type === "PAID" && data.fee <= 0),
  {
    message: "Paid events must have a fee greater than 0",
    path: ["fee"],
  },
);

export const updateEventSchema = eventBaseSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
