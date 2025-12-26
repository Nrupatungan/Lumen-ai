"use client";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  signUpSchema,
  type SignUpInput,
} from "@/lib/validation/auth";
import { GithubIcon, GoogleIcon } from "./CustomIcon";
import { OAuthLogin } from "@/actions/oauth-action";
import Link from "next/link";
import api from "@/lib/apiClient";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setError
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpInput) {
    setLoading(true)

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
      const res = await api.post("/users/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!res) {
        setError("root", { message: "Email already in use" });
      } else {
        // Redirect or show success (your choice)
        setSuccess(res.data.message);
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 2000)
      }

    } catch (err) {
      setError("root", { message: err ? err as string : "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
        {isSubmitSuccessful && <Alert severity="success">{success}</Alert>}

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
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { accept: "image/*" } }}
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
          size="large"
          disabled={loading}
        >
          Create Account {" "}
          {loading &&  
            <CircularProgress 
              size={24} 
              color="info"
              sx={{
              ml: "10px"
              }}
            />
          }
        </Button>

        {/* OAuth Buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            type="button"
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => OAuthLogin("google")}
          >
            Sign in with Google
          </Button>

          <Button
            type="button"
            fullWidth
            variant="outlined"
            startIcon={<GithubIcon />}
            onClick={() => OAuthLogin("github")}
          >
            Sign in with Github
          </Button>

          <Typography textAlign="center">
            Already have an account?{" "}
            <Link href="/sign-in">Sign in</Link>
          </Typography>
        </Box>
      </Stack>
    </form>
  );
}
