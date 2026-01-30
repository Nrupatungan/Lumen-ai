import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password too short (min 8)"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signUpSchema = z
  .object({
    name: z.string().min(4, "Name is too short"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    image: z
      .custom<FileList | undefined>()
      .optional()
      .refine(
        (files) =>
          !files ||
          (typeof FileList !== "undefined" &&
            files instanceof FileList &&
            files.length <= 1),
        "Invalid file input",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileEditSchema = z.object({
  name: z.string().min(4, "Name is too short"),
  image: z
    .custom<FileList | undefined>()
    .optional()
    .refine(
      (files) =>
        !files ||
        (typeof FileList !== "undefined" &&
          files instanceof FileList &&
          files.length <= 1),
      "Invalid file input",
    ),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password too short (min 6)"),
  image: z.url().optional(),
  role: z.enum(["user", "admin"]).default("user").optional(),
  emailVerified: z.date().optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export const requestPasswordResetSchema = z.object({
  email: z.email("Invalid email"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
