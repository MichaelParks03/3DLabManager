import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  ViewInAr as ViewInArIcon,
  FiberNew as FiberNewIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  AssignmentReturn as AssignmentReturnIcon,
} from "@mui/icons-material";

/**
 * Home Page Component
 * Landing page with hero section, quick navigation cards, and changelog
 * University-compliant design with clear hierarchy and accessibility
 */
function Home() {
  // Quick access cards configuration
  const quickAccessCards = [
    {
      title: "Items",
      description:
        "Browse and search 500+ lab equipment items. Filter by category, check availability, and manage checkouts with QR codes.",
      icon: <InventoryIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      path: "/items",
      color: "primary.main",
    },
    {
      title: "3D Map",
      description:
        "Explore interactive 3D lab environments. Locate equipment in real-time and navigate the Senior Design Engineering Lab.",
      icon: <ViewInArIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
      path: "/map3d",
      color: "secondary.main",
    },
  ];

  // Changelog data for "What's New" section
  const changelog = [
    {
      version: "Version 1.0 - Launch Release",
      date: "March 2026",
      items: [
        "Browse and search 500+ lab equipment items with advanced filtering",
        "Check out and return equipment with QR code tracking",
        "Interactive 3D lab map with real-time item locations",
        "View checkout history for each equipment item",
        "Report issues directly from item detail pages",
        "Secure authentication with password reset functionality",
        "Mobile-responsive design for on-the-go access",
        "Admin dashboard for equipment and user management",
      ],
    },
  ];

  return (
    <Box sx={{ py: 2 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: "center",
          py: { xs: 3, md: 4 },
          px: 2,
          backgroundColor: "background.paper",
          borderRadius: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "2rem", md: "3rem" },
            fontWeight: 700,
            color: "primary.main",
            mb: 2,
            letterSpacing: "-0.025em",
          }}
        >
          3D Lab Manager
        </Typography>

        <Typography
          variant="h2"
          component="p"
          sx={{
            fontSize: { xs: "1.125rem", md: "1.25rem" },
            color: "text.secondary",
            fontWeight: 400,
            maxWidth: "700px",
            mx: "auto",
            lineHeight: 1.6,
            mb: 2,
          }}
        >
          Browse equipment, locate items, and manage checkouts quickly in the
          Senior Design Engineering Lab.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Chip
            label="500+ Equipment Items"
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label="3 Lab Locations"
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label="Real-time Tracking"
            color="success"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {/* Quick Access Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          Quick Access
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          {quickAccessCards.map((card) => (
            <Box key={card.title} sx={{ flex: 1, display: "flex" }}>
              <Card
                sx={{
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {card.icon}
                    <Typography
                      variant="h3"
                      component="h3"
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      {card.title}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.6,
                      flex: 1,
                      minHeight: "3em",
                    }}
                  >
                    {card.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2.5, pt: 0 }}>
                  <Button
                    component={Link}
                    to={card.path}
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: card.color,
                      "&:hover": {
                        backgroundColor: card.color,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Go to {card.title}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>

      {/* How to Get Started Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          How to Get Started
        </Typography>

        <Card
          sx={{
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "primary.50",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 4,
                maxWidth: 800,
                mx: "auto",
              }}
            >
              {/* Step 1 */}
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <SearchIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1, color: "primary.dark" }}
                >
                  1. Browse Items
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search the equipment catalog or explore the 3D map to find what you need.
                </Typography>
              </Box>

              {/* Step 2 */}
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "success.main",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <AssignmentReturnIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1, color: "primary.dark" }}
                >
                  2. Check Out & Return
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check out items for your project and return them when done.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* What's New Section */}
      <Box>
        <Typography
          variant="h2"
          component="h2"
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "text.primary",
            mb: 3,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          What's New
        </Typography>

        <Card
          sx={{
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {changelog.map((release) => (
              <Box
                key={release.version}
                sx={{ mb: 3, "&:last-child": { mb: 0 } }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <FiberNewIcon
                    sx={{
                      color: "primary.main",
                      fontSize: "1.5rem",
                    }}
                  />
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {release.version}
                  </Typography>
                  <Chip
                    label={release.date}
                    size="small"
                    variant="outlined"
                    sx={{ ml: "auto" }}
                  />
                </Box>

                <List dense sx={{ pl: 2 }}>
                  {release.items.map((item, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <CheckCircleIcon
                          sx={{
                            fontSize: "1rem",
                            color: "success.main",
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        slotProps={{
                          primary: {
                            variant: "body2",
                            color: "text.secondary",
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Home;
