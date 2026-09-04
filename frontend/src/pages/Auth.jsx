import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Link,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

function Auth() {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated, requestPasswordReset } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleTabChange = (_, value) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
  };

  const handleLoginChange = (field) => (e) => {
    setLoginForm({ ...loginForm, [field]: e.target.value });
  };

  const handleSignupChange = (field) => (e) => {
    setSignupForm({ ...signupForm, [field]: e.target.value });
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleOpenForgotPassword = () => {
    setForgotPasswordOpen(true);
    setResetEmail(loginForm.email); // Pre-fill with login email if available
    setResetError("");
    setResetSuccess("");
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setResetEmail("");
    setResetError("");
    setResetSuccess("");
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    if (!resetEmail) {
      setResetError("Please enter your email address");
      setResetLoading(false);
      return;
    }

    if (!isValidEmail(resetEmail)) {
      setResetError("Please enter a valid email address");
      setResetLoading(false);
      return;
    }

    const result = await requestPasswordReset(resetEmail);

    if (result.success) {
      setResetSuccess(
        "Password reset link sent! Please check your email inbox (and spam folder)."
      );
      // Close dialog after 3 seconds
      setTimeout(() => {
        handleCloseForgotPassword();
      }, 3000);
    } else {
      setResetError(result.error || "Failed to send reset email");
    }

    setResetLoading(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginForm.email || !loginForm.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!isValidEmail(loginForm.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Invalid credentials");
    }

    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !signupForm.firstName ||
      !signupForm.lastName ||
      !signupForm.email ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!isValidEmail(signupForm.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!signupForm.email.endsWith("@mavs.uta.edu")) {
      setError("Must use UTA student email (@mavs.uta.edu)");
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await signup({
      firstName: signupForm.firstName,
      lastName: signupForm.lastName,
      email: signupForm.email,
      password: signupForm.password,
    });

    if (result.success) {
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } else {
      setError(result.error || "Signup failed");
    }

    setLoading(false);
  };

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
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            3D Lab Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            University of Texas at Arlington
          </Typography>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Login" icon={<LoginIcon />} iconPosition="start" />
            <Tab
              label="Sign Up"
              icon={<PersonAddIcon />}
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            {activeTab === 0 && (
              <form
                onSubmit={handleLoginSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <TextField
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleLoginChange("email")}
                  required
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={handleLoginChange("password")}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: "right", mt: -0.5 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={handleOpenForgotPassword}
                    sx={{
                      cursor: "pointer",
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            )}

            {activeTab === 1 && (
              <form
                onSubmit={handleSignupSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="First Name"
                    value={signupForm.firstName}
                    onChange={handleSignupChange("firstName")}
                    required
                  />
                  <TextField
                    label="Last Name"
                    value={signupForm.lastName}
                    onChange={handleSignupChange("lastName")}
                    required
                  />
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={signupForm.email}
                  onChange={handleSignupChange("email")}
                  required
                  helperText="Must be @mavs.uta.edu"
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={signupForm.password}
                  onChange={handleSignupChange("password")}
                  required
                />

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange("confirmPassword")}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={handleCloseForgotPassword}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "1.5rem", fontWeight: 700, pb: 1 }}>
          Reset Password
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your
            password.
          </DialogContentText>

          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}

          {resetSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {resetSuccess}
            </Alert>
          )}

          <form onSubmit={handleResetPasswordSubmit}>
            <TextField
              autoFocus
              label="Email Address"
              type="email"
              fullWidth
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetLoading || !!resetSuccess}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={handleCloseForgotPassword}
            disabled={resetLoading}
            size="large"
            sx={{
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPasswordSubmit}
            variant="contained"
            disabled={resetLoading || !!resetSuccess}
            size="large"
            sx={{
              fontWeight: 700,
              textTransform: "none",
              px: 3,
            }}
          >
            {resetLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Auth;
