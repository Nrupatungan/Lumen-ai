"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

type Props = {
  days: number;
  onChange: (days: number) => void;
};

export function DaysSelector({ days, onChange }: Props) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={days}
      onChange={(_, value) => value && onChange(value)}
    >
      <ToggleButton value={7}>7d</ToggleButton>
      <ToggleButton value={14}>14d</ToggleButton>
      <ToggleButton value={30}>30d</ToggleButton>
    </ToggleButtonGroup>
  );
}
