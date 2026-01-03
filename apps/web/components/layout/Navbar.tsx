"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SetStateAction, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Container,
  Collapse,
  ListItemIcon,
} from "@mui/material";

// Material Icons
import PsychologyIcon from "@mui/icons-material/Psychology"; // Replacement for Brain
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ThemeToggle from "@/components/ThemeToggle";
import { signOutAction } from "@/actions/sign-out-action";
import { getInitials } from "@/utils";
import { Person, Dashboard, Logout } from "@mui/icons-material";
import { protectedLinks, publicLinks } from "@/lib/data";
import { useMe } from "@/hooks/useMe";

const tierColors = {
  Free: "action.disabledBackground",
  Go: "primary.main",
  Pro: "secondary.main",
};

export default function Navbar({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: user } = useMe(isAuthenticated);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64, gap: 2 }}>
          {/* Logo Section */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 1.5,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <PsychologyIcon />
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ trackingTight: -0.5 }}
            >
              LumenAI
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              gap: 1,
              ml: 4,
            }}
          >
            {isAuthenticated
              ? protectedLinks.map((link, idx) => (
                  <NavButton key={idx} link={link} isActive={isActive} />
                ))
              : publicLinks.map((link, idx) => (
                  <NavButton key={idx} link={link} isActive={isActive} />
                ))}
          </Box>

          {/* Right Side Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeToggle />

            {user ? (
              <>
                <Button
                  onClick={handleOpenUserMenu}
                  sx={{
                    textTransform: "none",
                    color: "inherit",
                    gap: 1.5,
                    px: 1,
                    borderRadius: 2,
                  }}
                >
                  <Avatar
                    src={user.image!}
                    sx={{ width: 32, height: 32, fontSize: "0.75rem" }}
                  >
                    {getInitials(user.name)}
                  </Avatar>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    {user.name.split(" ")[0]}
                  </Typography>
                  <Box
                    sx={{
                      display: { xs: "none", sm: "block" },
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      bgcolor: tierColors[user.plan],
                      color: user.plan === "Free" ? "text.primary" : "white",
                    }}
                  >
                    {user.plan}
                  </Box>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseUserMenu}
                  slotProps={{
                    paper: {
                      elevation: 0,
                      sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        "& .MuiAvatar-root": {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
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
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem
                    component={Link}
                    href="/dashboard"
                    onClick={handleCloseUserMenu}
                  >
                    <ListItemIcon>
                      <Dashboard fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/pricing"
                    onClick={handleCloseUserMenu}
                  >
                    <ListItemIcon>✨</ListItemIcon>
                    Upgrade
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={handleCloseUserMenu}
                  >
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  {user.role === "admin" && (
                    <MenuItem
                      component={Link}
                      href="/admin"
                      onClick={handleCloseUserMenu}
                    >
                      Admin Panel
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleCloseUserMenu();
                      (async () => signOutAction())();
                    }}
                    sx={{ color: "error.main" }}
                  >
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  component={Link}
                  href="/sign-in"
                  variant="text"
                  size="small"
                  color="inherit"
                  sx={{ textTransform: "capitalize" }}
                >
                  Sign in
                </Button>
                <Button
                  component={Link}
                  href="/sign-up"
                  variant="contained"
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                  disableElevation
                >
                  Sign up
                </Button>
              </Box>
            )}

            {/* Mobile Toggle */}
            <IconButton
              sx={{ display: { md: "none" } }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Menu */}
      <Collapse in={mobileMenuOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            display: { md: "none" },
            borderTop: 1,
            borderColor: "divider",
            pb: 2,
          }}
        >
          {isAuthenticated
            ? protectedLinks.map((link, idx) => (
                <HamburgerMenuItem
                  key={idx}
                  link={link}
                  setMobileMenuOpen={setMobileMenuOpen}
                  isActive={isActive}
                />
              ))
            : publicLinks.map((link, idx) => (
                <HamburgerMenuItem
                  key={idx}
                  link={link}
                  setMobileMenuOpen={setMobileMenuOpen}
                  isActive={isActive}
                />
              ))}
        </Box>
      </Collapse>
    </AppBar>
  );
}

export interface HamburgerMenuProps {
  link: {
    label: string;
    href: string;
  };
  setMobileMenuOpen: (value: SetStateAction<boolean>) => void;
  isActive: (href: string) => boolean;
}

export function HamburgerMenuItem({
  link,
  setMobileMenuOpen,
  isActive,
}: HamburgerMenuProps) {
  return (
    <MenuItem
      key={link.href}
      component={Link}
      href={link.href}
      onClick={() => setMobileMenuOpen(false)}
      sx={{
        py: 2,
        px: 4,
        bgcolor: isActive(link.href) ? "action.selected" : "transparent",
        color: isActive(link.href) ? "primary.main" : "inherit",
      }}
    >
      {link.label}
    </MenuItem>
  );
}

export interface NavButtonProps {
  link: {
    label: string;
    href: string;
  };
  isActive: (href: string) => boolean;
}

export function NavButton({ link, isActive }: NavButtonProps) {
  return (
    <Button
      key={link.href}
      component={Link}
      href={link.href}
      size="small"
      variant="text"
      sx={{
        color: isActive(link.href) ? "primary.main" : "text.secondary",
        bgcolor: isActive(link.href) ? "action.selected" : "transparent",
        fontWeight: 500,
        "&:hover": { bgcolor: "action.hover" },
        textTransform: "capitalize",
      }}
    >
      {link.label}
    </Button>
  );
}
