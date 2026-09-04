import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

/**
 * Protected route wrapper for admin area
 * Requires user to be authenticated and have admin role
 */
const AdminProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (loading) {
      // Show "taking longer than usual" message after 5 seconds
      const slowTimer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 5000);

      // Set a timeout for 60 seconds (matches ProtectedRoute timeout for consistency)
      const timeoutTimer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 60000);

      return () => {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
      };
    } else {
      setLoadingTimeout(false);
      setShowSlowMessage(false);
    }
  }, [loading]);

  if (loading) {
    if (loadingTimeout) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="error">
            Authentication is taking longer than expected
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This might be due to network issues or cached session data.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              // Clear local storage and reload
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
          >
            Clear Cache and Retry
          </Button>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        {showSlowMessage && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Taking longer than usual... Please wait.
          </Typography>
        )}
      </Box>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has admin role or required role
  const userRole = user?.role || 'student';
  const hasAccess = userRole === 'admin' || (requiredRole && userRole === requiredRole);

  if (!hasAccess) {
    console.warn(`Access denied. User role: ${userRole}, Required: ${requiredRole || 'admin'}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
