"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: Props) {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Card sx={(theme) => ({
        borderRadius: 3,
        width: 400, 
        p: 2,
        ...theme.applyStyles("dark", {
          border: "1px solid grey"
        })
      })}>
        <CardContent>
          <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 3 }}>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
