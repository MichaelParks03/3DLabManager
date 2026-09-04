import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Avatar,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  ViewInAr as ViewInArIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  HelpOutline as HelpIcon,
} from "@mui/icons-material";

/**
 * Top Navigation Component
 * University-compliant navigation bar with responsive design
 * Includes UTA branding and accessibility features
 */
function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Get user initials
  const getUserInitials = () => {
    if (!user) return "";
    const firstInitial = user.firstName?.charAt(0) || "";
    const lastInitial = user.lastName?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Navigation items configuration
  const navItems = [
    { path: "/", label: "Home", icon: <HomeIcon /> },
    { path: "/items", label: "Items", icon: <InventoryIcon /> },
    { path: "/map3d", label: "3D Map", icon: <ViewInArIcon /> },
  ];

  // Add Admin link only for admin users
  if (user?.role === "admin") {
    navItems.push({ path: "/admin", label: "Admin", icon: <AdminIcon /> });
  }

  // Get current tab value for controlled tabs
  const getCurrentTabValue = () => {
    const currentPath = location.pathname;
    const matchingItem = navItems.find(
      (item) =>
        item.path === currentPath ||
        (item.path === "/items" && currentPath.startsWith("/item/"))
    );
    return matchingItem ? matchingItem.path : false;
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
    handleMobileMenuClose();
    handleProfileMenuClose();
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // Mobile Menu Component
  const MobileMenu = () => {
    const menuItems = [];

    if (isAuthenticated) {
      navItems.forEach((item) => {
        menuItems.push(
          <MenuItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleMobileMenuClose}
            selected={getCurrentTabValue() === item.path}
            sx={{ gap: 1 }}
            aria-label={`Navigate to ${item.label}`}
          >
            {item.icon}
            {item.label}
          </MenuItem>
        );
      });

      menuItems.push(<Divider key="divider" />);
    }

    return (
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              minWidth: 200,
            },
          },
        }}
      >
        {menuItems}
      </Menu>
    );
  };

  // Profile Menu Component
  const ProfileMenu = () => (
    <Menu
      anchorEl={profileMenuAnchor}
      open={Boolean(profileMenuAnchor)}
      onClose={handleProfileMenuClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            mt: 1.5,
            minWidth: 180,
          },
        },
      }}
    >
      <MenuItem onClick={handleLogout} sx={{ gap: 1.5 }}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
      <MenuItem onClick={handleProfileMenuClose} sx={{ gap: 1.5 }}>
        <ListItemIcon>
          <HelpIcon fontSize="small" />
        </ListItemIcon>
        Help
      </MenuItem>
    </Menu>
  );

  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          top: -50,
          left: 10,
          zIndex: 9999,
          backgroundColor: "primary.main",
          color: "white",
          padding: "8px 16px",
          textDecoration: "none",
          borderRadius: 1,
          fontWeight: 600,
          "&:focus": {
            top: 10,
          },
        }}
      >
        Skip to main content
      </Box>

      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          backgroundColor: "primary.main",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
          }}
        >
          {/* University Wordmark and App Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* UTA Logo placeholder - In production, use official university logo */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                "&:focus-visible": {
                  outline: "2px solid white",
                  outlineOffset: "2px",
                  borderRadius: 1,
                },
              }}
            >
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  color: "white",
                  letterSpacing: "-0.025em",
                }}
              >
                UTA
              </Typography>
            </Box>

            {/* App Title */}
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1rem", md: "1.125rem" },
                color: "white",
                display: { xs: "none", sm: "block" },
              }}
            >
              3D Lab Manager
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Desktop Navigation */}
            {!isMobile ? (
              <>
                {isAuthenticated && (
                  <Tabs
                    value={getCurrentTabValue()}
                    textColor="inherit"
                    indicatorColor="secondary"
                    sx={{
                      "& .MuiTab-root": {
                        color: "rgba(255, 255, 255, 0.8)",
                        fontWeight: 500,
                        minHeight: 48,
                        "&.Mui-selected": {
                          color: "white",
                        },
                        "&:focus-visible": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "white",
                        height: 3,
                      },
                    }}
                  >
                    {navItems.map((item) => (
                      <Tab
                        key={item.path}
                        label={item.label}
                        value={item.path}
                        component={Link}
                        to={item.path}
                        icon={item.icon}
                        iconPosition="start"
                        sx={{ gap: 1 }}
                        aria-label={`Navigate to ${item.label}`}
                      />
                    ))}
                  </Tabs>
                )}

                {/* Profile Avatar */}
                {isAuthenticated ? (
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      p: 0,
                      ml: 2,
                      "&:focus-visible": {
                        outline: "2px solid white",
                        outlineOffset: "2px",
                      },
                    }}
                    aria-label="Open profile menu"
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: "white",
                        color: "primary.main",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                  </IconButton>
                ) : (
                  <Button
                    component={Link}
                    to="/auth"
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                    aria-label="Login or Sign up"
                  >
                    Login
                  </Button>
                )}
                <ProfileMenu />
              </>
            ) : (
              // Mobile Navigation
              <>
                {isAuthenticated && (
                  <IconButton
                    onClick={handleMobileMenuOpen}
                    sx={{
                      color: "white",
                      "&:focus-visible": {
                        outline: "2px solid white",
                        outlineOffset: "2px",
                      },
                    }}
                    aria-label="Open navigation menu"
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                {isAuthenticated ? (
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      p: 0,
                      "&:focus-visible": {
                        outline: "2px solid white",
                        outlineOffset: "2px",
                      },
                    }}
                    aria-label="Open profile menu"
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: "white",
                        color: "primary.main",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      {getUserInitials()}
                    </Avatar>
                  </IconButton>
                ) : (
                  <Button
                    component={Link}
                    to="/auth"
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    size="small"
                    sx={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                    aria-label="Login or Sign up"
                  >
                    Login
                  </Button>
                )}
                <MobileMenu />
                <ProfileMenu />
              </>
            )}
          </Box>
        </Toolbar>

        {/* Info banner */}
        <Box
          sx={{
            backgroundColor: "#f97316",
            color: "white",
            py: 0.5,
            px: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Senior Design Engineering Lab - Equipment Management System
        </Box>
      </AppBar>
    </>
  );
}

export default TopNav;
