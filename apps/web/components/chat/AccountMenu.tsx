"use client";

import * as React from "react";
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Typography,
  Tooltip,
  ListItemIcon,
} from "@mui/material";
import { AutoAwesome, Logout, Settings } from "@mui/icons-material";
import { signOutAction } from "@/actions/sign-out-action";

export default function AccountMenu() {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>DS</Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              mt: 1.5,
              overflow: "visible",
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
      >
        {/* User info */}
        <MenuItem disabled>
          <Avatar sx={{ width: 28, height: 28, fontSize: 14, mr: 1 }}>
            DS
          </Avatar>
          <Box>
            <Typography fontSize={14}>Dinesh Sake</Typography>
            <Typography variant="caption" color="text.secondary">
              @dineshsake
            </Typography>
          </Box>
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <AutoAwesome fontSize="small" />
          </ListItemIcon>
          Upgrade Plan
        </MenuItem>

        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>

        <MenuItem
          onClick={async () => {
            handleClose();
            await signOutAction();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
