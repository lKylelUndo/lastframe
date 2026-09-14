import { z } from "zod";

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required."),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const archiveQuerySchema = z.object({
  date: z
    .string()
    .regex(YYYY_MM_DD, "Date must be in YYYY-MM-DD format.")
    .optional(),
  roomId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ArchiveQueryInput = z.infer<typeof archiveQuerySchema>;
