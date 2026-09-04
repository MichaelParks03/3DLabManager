import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

// Import styles
// import './styles/globals.css';

// Initialize MSW in development
if (import.meta.env.DEV) {
  import("./mocks/browser.js");
}

// Components
import TopNav from "./components/TopNav.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import { Navigate } from 'react-router-dom';

// Pages
import Home from "./pages/Home.jsx";
import Items from "./pages/Items.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import Map3d from "./pages/Map3d.jsx"; // Adding 3D viewer page
import Map3dIndex from "./pages/Map3dIndex.jsx"; // Adding 3D lab grid page
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import ItemsAdmin from './pages/admin/ItemsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import LabsAdmin from './pages/admin/LabsAdmin';
import IssuesAdmin from './pages/admin/IssuesAdmin';
import ModelsAdmin from './pages/admin/ModelsAdmin';


// Material-UI theme configuration matching university standards
const theme = createTheme({
  palette: {
    primary: {
      main: "#1e3a8a", // UTA Navy
      light: "#2563eb", // UTA Blue
      dark: "#1e40af",
    },
    secondary: {
      main: "#64748b", // Neutral
      light: "#94a3b8",
      dark: "#475569",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "system-ui", "sans-serif"].join(","),
    h1: {
      fontSize: "2.25rem",
      fontWeight: 600,
      marginBottom: "1rem",
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      marginBottom: "0.75rem",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      marginBottom: "0.5rem",
    },
    body1: {
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

/**
 * Main Application Component
 * Handles routing, global layout, and theme provider setup
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Admin Routes with Admin Layout */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/items" replace />} />
            <Route path="items" element={<ItemsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="labs" element={<LabsAdmin />} />
            <Route path="issues" element={<IssuesAdmin />} />
            <Route path="models" element={<ModelsAdmin />} />
          </Route>

          {/* Public/User Routes with Main Layout */}
          <Route
            path="*"
            element={
              <Box
                sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
              >
                {/* Main navigation */}
                <TopNav />

                {/* Main content area */}
                <Box
                  component="main"
                  id="main-content"
                  sx={{
                    flex: 1,
                    py: { xs: 2, md: 4 },
                  }}
                >
                  <Container
                    maxWidth={false}
                    disableGutters
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 0,
                      px: { xs: 2, sm: 3, md: 4 },
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                      <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
                      <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
                      <Route path="/map3d" element={<ProtectedRoute><Map3dIndex /></ProtectedRoute>} />
                      <Route path="/map3d/:labId" element={<ProtectedRoute><Map3d /></ProtectedRoute>} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                    </Routes>
                  </Container>
                </Box>

                {/* Footer */}
                <Footer />
              </Box>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
