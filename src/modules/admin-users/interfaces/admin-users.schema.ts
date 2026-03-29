import { z } from "zod";

export const adminUserCreateSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().max(200).optional(),
  lastName: z.string().trim().max(200).optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export type AdminUserCreateValues = z.infer<typeof adminUserCreateSchema>;

export const adminUserEditSchema = z.object({
  userAuthId: z.string().min(1),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
  status: z.enum(["ACTIVE", "DEACTIVE", "SUSPEND"]),
  name: z.string().trim().max(200),
  lastName: z.string().trim().max(200),
  password: z.string().refine(
    (v) => v.trim() === "" || v.trim().length >= 8,
    {
      message: "Password must be at least 8 characters.",
    },
  ),
});

export type AdminUserEditValues = z.infer<typeof adminUserEditSchema>;
