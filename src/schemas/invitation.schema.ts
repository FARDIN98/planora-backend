import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const respondInvitationSchema = z.object({
  action: z.enum(["accept", "decline"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
