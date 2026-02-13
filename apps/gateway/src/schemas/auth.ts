import { z } from "zod";

export const signupBodySchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(8).max(128)
});

export const loginBodySchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(8).max(128)
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
