import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Shows loading state while checking authentication
 * Displays timeout error if authentication takes too long
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (loading) {
      // Show "taking longer than usual" message after 5 seconds
      const slowTimer = setTimeout(() => {
        setShowSlowMessage(true);
      }, 5000);

      // Set a longer timeout (60s) since session restoration no longer has a timeout
      // Only show "Clear cache" option if genuinely stuck
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
            minHeight: '60vh',
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
          minHeight: '60vh',
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

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default ProtectedRoute;
