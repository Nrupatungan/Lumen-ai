"use client";

import { UsageDashboardSeries } from "@/lib/types";
import { Card, CardContent, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

type Props = {
  series: UsageDashboardSeries[];
};

export function UsageChart({ series }: Props) {
  const dates = series.map((s) => s.date);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Usage Over Time
        </Typography>

        <LineChart
          height={320}
          xAxis={[
            {
              data: dates,
              scaleType: "point",
            },
          ]}
          series={[
            {
              data: series.map((s) => s.totalTokens),
              label: "Total Tokens",
            },
            {
              data: series.map((s) => s.requestCount),
              label: "Requests",
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
