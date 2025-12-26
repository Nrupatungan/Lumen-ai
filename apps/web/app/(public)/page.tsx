"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { Button, Typography, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ["ping"],
    queryFn: async () => "pong",
  });

  return (
    <Stack spacing={2} p={4}>
      <ThemeToggle />
      <Typography variant="body2">Base Setup Working ✅</Typography>
      <Typography>Query result: {data}</Typography>
      <Button variant="contained">MUI Button</Button>
    </Stack>
  );
}
