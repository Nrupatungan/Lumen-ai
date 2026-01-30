"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Link,
  Stack,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/apiClient";
import { AppLogoIcon } from "@/components/CustomIcon";
import { useToast } from "@/hooks/useToast";
import {
  RequestPasswordResetInput,
  requestPasswordResetSchema,
} from "@/lib/validation/auth";

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    setLoading(true);

    try {
      await api.post("/users/request-password-reset", data);
      setEmailSent(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Password reset request",
        severity: "error",
        description: err
          ? (err as string)
          : "If an account exists, a reset link will be sent.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth="xs">
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 10 }}>
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

        {/* ================= SUCCESS STATE ================= */}
        {emailSent ? (
          <Card
            sx={(theme) => ({
              borderRadius: 3,
              border: "1px solid",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              borderColor: theme.palette.background.paper,
              ...theme.applyStyles("dark", {
                boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                borderColor: "rgba(136, 131, 131, 0.6)",
              }),
            })}
          >
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Box
                sx={{
                  mx: "auto",
                  mb: 3,
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: (theme) => theme.palette.primary.main + "1A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircleIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Check your email
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We&apos;ve sent password reset instructions to{" "}
                <Box component="span" fontWeight={500} color="text.primary">
                  {getValues("email")}
                </Box>
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Didn&apos;t receive the email?{" "}
                <Link
                  component="button"
                  underline="hover"
                  onClick={() => setEmailSent(false)}
                >
                  Try again
                </Link>
              </Typography>

              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 4, textTransform: "capitalize" }}
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push("/sign-in")}
              >
                Back to login
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ================= FORM STATE ================= */
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
                  Reset your password
                </Typography>
              }
              subheader={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  mt={2}
                >
                  Enter your email and we&apos;ll send you instructions to reset
                  your password
                </Typography>
              }
            />

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                  <TextField
                    label="Email"
                    size="small"
                    type="email"
                    {...register("email")}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="medium"
                    fullWidth
                    disabled={loading}
                    sx={{
                      textTransform: "inherit",
                      borderRadius: 1.5,
                    }}
                  >
                    {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                    Send reset link
                  </Button>

                  <Box textAlign="center">
                    <Link
                      href="/sign-in"
                      underline="hover"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "text.secondary",
                        fontSize: 14,
                      }}
                    >
                      <ArrowBackIcon sx={{ width: 20, height: 15 }} />
                      Back to login
                    </Link>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
