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

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;
