import { stats } from "@/lib/data";
import { alpha, Box, Container, Grid, Typography } from "@mui/material";
import React from "react";

export const StatsSection = () => {
  return (
    <Box
      sx={{
        py: 6,
        borderY: 1,
        borderColor: "divider",
        bgcolor: alpha("#000", 0.02),
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          columns={{ xs: 4, md: 12 }}
          justifyContent="center"
        >
          {stats.map((stat) => (
            <Grid
              key={stat.label}
              size={{ xs: 4, md: 3 }} // ✅ 1 per row → 4 per row
              sx={{ textAlign: "center" }}
            >
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary"
                sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" } }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, mt: 0.5 }}
              >
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
