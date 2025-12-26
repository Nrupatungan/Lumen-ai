"use client";

// - import { CssVarsProvider, extendTheme } from '@mui/material/styles';
// + import { ThemeProvider, createTheme } from '@mui/material/styles';

// - const theme = extendTheme();
// + const theme = createTheme({
// +   cssVariables: true,
// +   colorSchemes: { light: true, dark: true },
// + });

// - <CssVarsProvider theme={theme}>
// + <ThemeProvider theme={theme}></ThemeProvider>

import * as React from "react";
import {
  ThemeProvider, createTheme
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-mui-color-scheme"
  },
  colorSchemes: { light: true, dark: true },
});

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      disableTransitionOnChange
    >
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
