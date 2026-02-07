"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { UsageSummaryCards } from "./UsageSummaryCards";
import { UsageChart } from "./UsageChart";
import { DaysSelector } from "./DaysSelector";
import { TodayUsage, UsageDashboardResponse } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";

export function UsageDashboard() {
  const [days, setDays] = useState(7);
  const [today, setToday] = useState<TodayUsage | null>(null);
  const [dashboard, setDashboard] = useState<UsageDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      apiClient.fetchTodayUsage(),
      apiClient.fetchUsageDashboard(days),
    ])
      .then(([todayUsage, dashboardUsage]) => {
        setToday(todayUsage);
        setDashboard(dashboardUsage);
      })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !today || !dashboard) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>
          Usage Dashboard
        </Typography>
        <DaysSelector days={days} onChange={setDays} />
      </Stack>

      <UsageSummaryCards usage={today} />

      <UsageChart series={dashboard.series} />
    </Stack>
  );
}
