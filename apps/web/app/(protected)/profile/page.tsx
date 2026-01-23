"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useState } from "react";

import { useMe } from "@/hooks/useMe";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export default function ProfilePage() {
  const { data, isLoading, error } = useMe();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <Box minHeight="60vh" display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!data || error) {
    return <Typography color="error">Failed to load profile</Typography>;
  }

  if (editing) {
    return (
      <ProfileEditForm
        user={data}
        onCancel={() => setEditing(false)}
        onSuccess={() => setEditing(false)}
      />
    );
  }

  const initials =
    data.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("") ?? "?";

  return (
    <Container maxWidth="md" sx={{ py: 11 }}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={data.image || undefined}
              sx={{ width: 72, height: 72 }}
            >
              {!data.image && initials}
            </Avatar>

            <Box flex={1}>
              <Typography fontWeight={600}>{data.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.email}
              </Typography>
              <Chip label={data.role} size="small" sx={{ mt: 1 }} />
            </Box>

            <Button
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
              sx={{ textTransform: "inherit" }}
            >
              Edit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
