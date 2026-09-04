import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockReset as LockResetIcon,
} from "@mui/icons-material";

/**
 * ResetPassword Page Component
 * Allows users to set a new password after clicking the reset link from email
 * Listens for PASSWORD_RECOVERY event from Supabase
 */
function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if we're in password recovery mode
  useEffect(() => {
    let mounted = true;

    const checkRecoveryMode = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          // Check if this is a recovery session
          if (session?.user) {
            setIsRecoveryMode(true);
          } else {
            setError("Invalid or expired password reset link.");
          }
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error("Error checking recovery mode:", err);
        if (mounted) {
          setError("Failed to verify reset link. Please try again.");
          setCheckingAuth(false);
        }
      }
    };

    checkRecoveryMode();

    // Listen for PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && mounted) {
        setIsRecoveryMode(true);
        setCheckingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordChange = (field) => (e) => {
    setPasswordForm({ ...passwordForm, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!passwordForm.password || !passwordForm.confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (passwordForm.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Update password
    const result = await updatePassword(passwordForm.password);

    if (result.success) {
      setSuccess("Password updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } else {
      setError(result.error || "Failed to update password");
    }

    setLoading(false);
  };

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 200px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Verifying reset link...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error if not in recovery mode
  if (!isRecoveryMode) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 200px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Card
          sx={{
            maxWidth: 480,
            width: "100%",
            border: "1px solid",
            borderColor: "divider",
            p: 4,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || "Invalid or expired password reset link"}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/auth")}
          >
            Return to Login
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: "100%",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            py: 3,
            px: 3,
            textAlign: "center",
          }}
        >
          <LockResetIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Reset Your Password
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Enter your new password below
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={passwordForm.password}
              onChange={handlePasswordChange("password")}
              required
              disabled={loading || !!success}
              helperText="At least 8 characters"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading || !!success}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
              required
              disabled={loading || !!success}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading || !!success}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !!success}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
              }}
            >
              {loading
                ? "Updating Password..."
                : success
                ? "Success!"
                : "Update Password"}
            </Button>

            <Button
              variant="text"
              onClick={() => navigate("/auth")}
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ResetPassword;
