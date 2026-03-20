import { z } from "zod";

export const updateRegistrationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "BANNED"]),
});

export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
