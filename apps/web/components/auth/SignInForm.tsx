"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
  Theme,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { signInAction } from "@/actions/sign-in-action";
import { OAuthLogin } from "@/actions/oauth-action";
import { AppLogoIcon } from "../CustomIcon";
import { GitHub, Google } from "@mui/icons-material";
import { useToast } from "@/hooks/useToast";
import { LoginInput, loginSchema } from "@/lib/validation/auth";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    const res = await signInAction(data);
    setLoading(false);

    if (!res.success) {
      toast({
        title: "Sign in Failed",
        severity: "error",
        description: res.error,
      });
    } else {
      toast({
        title: "Sign in Success",
        severity: "success",
        description: res.message,
      });
      setTimeout(() => router.push("/chat"), 2000);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Link
            href="/"
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              color: "text.primary",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppLogoIcon
                size={22}
                sx={(theme: Theme) => ({
                  fill: "white",
                  ...theme.applyStyles("dark", {
                    fill: "#1976d2",
                  }),
                })}
              />
            </Box>
            <Typography variant="h5" fontWeight={600}>
              LumenAI
            </Typography>
          </Link>
        </Box>

        <Card
          sx={(theme) => ({
            borderRadius: 3,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: theme.palette.background.paper,
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            ...theme.applyStyles("dark", {
              boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
              borderColor: "rgba(136, 131, 131, 0.6)",
            }),
          })}
        >
          <CardHeader
            title={
              <Typography variant="h5" fontWeight={600} textAlign="center">
                Welcome back
              </Typography>
            }
            subheader={
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Sign in to your account to continue
              </Typography>
            }
          />

          <CardContent>
            <Stack spacing={3}>
              {/* OAuth */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Google />}
                    onClick={() => OAuthLogin("google")}
                    sx={{
                      textTransform: "capitalize",
                    }}
                  >
                    Google
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GitHub />}
                    onClick={() => OAuthLogin("github")}
                    sx={{
                      textTransform: "capitalize",
                    }}
                  >
                    GitHub
                  </Button>
                </Grid>
              </Grid>

              {/* Divider */}
              <Box sx={{ position: "relative" }}>
                <Divider />
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    px: 1,
                    backgroundColor: "background.paper",
                  }}
                >
                  Or continue with
                </Typography>
              </Box>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    size="small"
                    type="email"
                    {...register("email")}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                  />

                  <Box>
                    <TextField
                      label="Password"
                      size="small"
                      type="password"
                      {...register("password")}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      fullWidth
                    />
                    <Link
                      href="/forgot-password"
                      variant="body2"
                      underline="hover"
                      sx={{
                        display: "block",
                        fontSize: 13,
                        mt: 1,
                        textAlign: "right",
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="medium"
                    disabled={loading}
                    fullWidth
                    sx={{
                      textTransform: "capitalize",
                      borderRadius: 1.5,
                    }}
                  >
                    Sign in{" "}
                    {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                  </Button>
                </Stack>
              </form>

              <Typography
                variant="body2"
                textAlign="center"
                color="text.secondary"
              >
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" underline="hover" fontWeight={500}>
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Legal */}
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 4, display: "block" }}
        >
          By signing in, you agree to our{" "}
          <Link href="/terms" underline="hover">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" underline="hover">
            Privacy Policy
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
