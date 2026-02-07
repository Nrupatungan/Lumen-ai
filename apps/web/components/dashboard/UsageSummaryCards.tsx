"use client";

import { TodayUsage } from "@/lib/types";
import { Card, CardContent, Grid, Typography } from "@mui/material";

type Props = {
  usage: TodayUsage;
};

export function UsageSummaryCards({ usage }: Props) {
  const items = [
    { label: "Total Tokens", value: usage.totalTokens },
    { label: "Prompt Tokens", value: usage.promptTokens },
    { label: "Completion Tokens", value: usage.completionTokens },
    { label: "Requests Today", value: usage.requestCount },
  ];

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {item.value.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
