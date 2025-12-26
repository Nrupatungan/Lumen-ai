"use client";

import { Button, Stack, TextField, Alert, CircularProgress, Box, Link, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signInAction } from "@/actions/sign-in-action";

import {
  loginSchema,
  type LoginInput,
} from "@repo/shared";
import { GithubIcon, GoogleIcon } from "./CustomIcon";
import { OAuthLogin } from "@/actions/oauth-action";
import ForgotPassword from "./ForgotPassword";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setError
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);

    const res = await signInAction(data);

    setLoading(false);
    if (!res.success) {
      setError("root", { message: res.error });
    } else {
      setSuccess(res.message);
      setTimeout(() => {
        window.location.href = "/chat";
      }, 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        {errors.root && <Alert severity="error">{errors.root.message}</Alert>}
        {isSubmitSuccessful && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Email"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <Box>
          <TextField
          label="Password"
          type="password"
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={{ width: "100%" }}
          />

          {/* Forgot Password */}
          <Link
            component="button"
            type="button"
            onClick={() => setOpen(true)}
            variant="body2"
            underline="hover"
            sx={{ width: "100%", textAlign: "right", mt: 1.5 }}
          >
            Forgot your password?
          </Link>
        </Box>


        <ForgotPassword open={open} handleClose={() => setOpen(false)} />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
        >
          Sign In {" "}
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
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={async () => {
                await OAuthLogin("google");
              }}
            >
              Sign in with Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GithubIcon />}
              onClick={async () => {
                await OAuthLogin("github");
              }}
            >
              Sign in with Github
            </Button>

            <Typography sx={{ textAlign: "center" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
              >
                Sign up
              </Link>
            </Typography>
          </Box>
      </Stack>
    </form>
  );
}
