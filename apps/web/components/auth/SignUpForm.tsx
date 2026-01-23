"use client";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Link,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { OAuthLogin } from "@/actions/oauth-action";
import { apiClient } from "@/lib/apiClient";
import NextLink from "next/link";
import { GitHub, Google } from "@mui/icons-material";
import { useToast } from "@/hooks/useToast";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpInput) {
    setLoading(true);

    try {
      const formData = new FormData();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, image, ...rest } = data;

      if (image instanceof FileList && image.length > 0) {
        formData.append("image", image[0]!);
      }

      Object.entries(rest).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      // 1️⃣ Register user
      const res = await apiClient.register(formData);

      switch (res.status) {
        case 409:
        case 401:
          toast({
            title: "Sign up Failed",
            severity: "error",
            description: res.data.message || "Invalid registration data",
          });
          break;
        case 201:
          toast({
            title: "Sign up Success",
            severity: "success",
            description: res.data.message,
          });
          break;
      }
    } catch (err) {
      console.error(err);

      toast({
        title: "Sign up",
        severity: "error",
        description: err ? (err as string) : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <TextField
          label="Name"
          size="small"
          {...register("name")}
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          size="small"
          label="Email"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          label="Upload Image"
          type="file"
          {...register("image")}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { accept: "image/*" },
          }}
          error={!!errors.image}
          helperText={errors.image?.message}
        />

        <TextField
          size="small"
          label="Password"
          type="password"
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <TextField
          size="small"
          label="Confirm Password"
          type="password"
          {...register("confirmPassword")}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          variant="contained"
          size="medium"
          disabled={loading}
          sx={{
            textTransform: "inherit",
          }}
        >
          Create account{" "}
          {loading && (
            <CircularProgress
              size={24}
              color="info"
              sx={{
                ml: "10px",
              }}
            />
          )}
        </Button>

        {/* OAuth Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            type="button"
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={() => OAuthLogin("google")}
            sx={{
              textTransform: "inherit",
            }}
          >
            Sign in with Google
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            startIcon={<GitHub />}
            onClick={() => OAuthLogin("github")}
            sx={{
              textTransform: "inherit",
            }}
          >
            Sign in with Github
          </Button>
        </Box>
        <Typography variant="body2" textAlign="center" color="text.secondary">
          Already have an account?{" "}
          <Link
            component={NextLink}
            href="/sign-in"
            underline="hover"
            fontWeight={500}
          >
            Sign in
          </Link>
        </Typography>
      </Stack>
    </form>
  );
}
