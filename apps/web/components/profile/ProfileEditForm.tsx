"use client";

import {
  Avatar,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { api } from "@/lib/apiClient";
import { ProfileEditInput, profileEditSchema } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProfileEditForm({ user, onCancel, onSuccess }: Props) {
  const { register, handleSubmit } = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { name: user.name },
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function onSubmit(data: ProfileEditInput) {
    setLoading(true);

    const formData = new FormData();
    const { image, name } = data;

    if (image instanceof FileList && image.length > 0) {
      formData.append("image", image[0]!);
    }

    if (name !== user.name) formData.append("name", name);

    await api.put("/users/me", formData);
    setLoading(false);
    onSuccess();
  }

  return (
    <Container maxWidth="md" sx={{ py: 11 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" mb={3}>
            Edit Profile
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Avatar
                src={preview || user.image}
                sx={{ width: 96, height: 96 }}
              />

              <Button component="label" variant="outlined">
                Upload new photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  {...register("image")}
                  onChange={(e) =>
                    setPreview(
                      e.target.files?.[0]
                        ? URL.createObjectURL(e.target.files[0])
                        : null,
                    )
                  }
                />
              </Button>

              <TextField label="Name" {...register("name")} fullWidth />

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading && <CircularProgress size={18} sx={{ mr: 1 }} />}
                  Save
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
