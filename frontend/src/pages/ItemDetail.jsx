import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Grid,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  Skeleton,
  Paper,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  OpenInNew as OpenInNewIcon,
  ReportProblem as ReportProblemIcon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Logout as CheckoutIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import { QRCodeCanvas } from "qrcode.react";

// API and components
import { getEquipmentById } from "../lib/supabaseItems.js";
import {
  checkoutEquipment,
  returnEquipment,
  getActiveCheckout,
  getCheckoutHistory,
} from "../lib/supabaseCheckout.js";
import { useAuth } from "../contexts/AuthContext";
import IssueModal from "../components/IssueModal";
import EmptyState from "../components/EmptyState";
import EquipmentDetails from "../components/EquipmentDetails";

/**
 * ItemDetail Page Component
 * Shows comprehensive item information with actions
 * Includes issue reporting modal and 3D map integration
 */
function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const qrCodeRef = useRef(null);

  // State management
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState(null);
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch item data, active checkout, and checkout history
  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getEquipmentById(id);

        if (!data) {
          setItem(null);
          setError("Item not found in database.");
          return;
        }

        setItem(data);

        // If item is checked out, fetch active checkout info
        if (data.status === "checked_out") {
          const checkout = await getActiveCheckout(id);
          setActiveCheckout(checkout);
        } else {
          setActiveCheckout(null);
        }

        // Fetch checkout history (last 3 records)
        const history = await getCheckoutHistory(id);
        setCheckoutHistory(history.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch item:", err);
        setError("Failed to load item details from database.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Navigation handlers
  const handleBack = () => {
    const itemsPath = "/items";
    const query = searchParams.toString();
    navigate(query ? `${itemsPath}?${query}` : itemsPath);
  };

  const handleOpen3D = () => {
    const targetLabId = item?.lab_id || item?.labId;

    if (!targetLabId) {
      setToast({
        open: true,
        message: "This item is not assigned to a lab yet.",
        severity: "warning",
      });
      return;
    }

    navigate(`/map3d/${targetLabId}?item=${item.id}`);
  };

  // Modal handlers
  const handleOpenIssueModal = () => {
    setIssueModalOpen(true);
  };

  const handleCloseIssueModal = () => {
    setIssueModalOpen(false);
  };

  const handleIssueSuccess = (notification) => {
    setToast({
      open: true,
      message: notification.message,
      severity: notification.type || "success",
    });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  // Checkout handlers
  const handleOpenCheckoutDialog = () => {
    setCheckoutDialogOpen(true);
  };

  const handleCloseCheckoutDialog = () => {
    setCheckoutDialogOpen(false);
  };

  const handleConfirmCheckout = async () => {
    if (!user || !user.id) {
      setToast({
        open: true,
        message: "You must be logged in to check out items.",
        severity: "error",
      });
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await checkoutEquipment(item.id, user.id);

      if (result.success) {
        setToast({
          open: true,
          message: "Item checked out successfully!",
          severity: "success",
        });

        setCheckoutDialogOpen(false);

        // Update local item state and fetch active checkout and history
        setItem((prev) => ({ ...prev, status: "checked_out" }));
        const checkout = await getActiveCheckout(item.id);
        setActiveCheckout(checkout);
        const history = await getCheckoutHistory(item.id);
        setCheckoutHistory(history.slice(0, 3));
      } else {
        setToast({
          open: true,
          message:
            result.error || "Failed to check out item. Please try again.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setToast({
        open: true,
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Return handlers
  const handleOpenReturnDialog = () => {
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
  };

  const handleConfirmReturn = async () => {
    if (!user || !user.id) {
      setToast({
        open: true,
        message: "You must be logged in to return items.",
        severity: "error",
      });
      return;
    }

    setReturnLoading(true);
    try {
      const result = await returnEquipment(item.id, user.id);

      if (result.success) {
        setToast({
          open: true,
          message: "Item returned successfully!",
          severity: "success",
        });

        setReturnDialogOpen(false);

        // Update local item state to reflect the return and refresh history
        setItem((prev) => ({ ...prev, status: "available" }));
        setActiveCheckout(null);
        const history = await getCheckoutHistory(item.id);
        setCheckoutHistory(history.slice(0, 3));
      } else {
        setToast({
          open: true,
          message: result.error || "Failed to return item. Please try again.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Return failed:", err);
      setToast({
        open: true,
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setReturnLoading(false);
    }
  };

  // Retry handler
  const handleRetry = () => {
    window.location.reload();
  };

  // QR Code handlers
  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `${item.id}-QR-Code.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({
          open: true,
          message: "QR code downloaded successfully!",
          severity: "success",
        });
      }
    }
  };

  const handlePrintQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector("canvas");
      if (canvas) {
        const printWindow = window.open("", "", "width=600,height=600");
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code - ${item.name}</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                }
                h2 { margin: 10px 0; }
                p { margin: 5px 0; font-size: 14px; }
                .qr-container { margin: 20px 0; }
              </style>
            </head>
            <body>
              <h2>${item.name}</h2>
              <p><strong>Item ID:</strong> ${item.id}</p>
              <p><strong>Location:</strong> ${item.locationPath}</p>
              <div class="qr-container">
                <img src="${canvas.toDataURL("image/png")}" alt="QR Code" />
              </div>
              <p>Scan to access item details and checkout</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  // Status chip configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case "available":
        return {
          color: "success",
          label: "Available",
          icon: <CheckCircleIcon sx={{ fontSize: 18 }} />,
        };
      case "checked_out":
        return {
          color: "warning",
          label: "Checked Out",
          icon: null,
        };
      case "broken":
        return {
          color: "error",
          label: "Broken",
          icon: null,
        };
      default:
        return {
          color: "default",
          label: status || "Unknown",
          icon: null,
        };
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
        <Card sx={{ overflow: "hidden" }}>
          <Grid container>
            <Grid item xs={5}>
              <Skeleton variant="rectangular" height={500} />
            </Grid>
            <Grid item xs={7}>
              <Box sx={{ p: 4 }}>
                <Skeleton
                  variant="text"
                  width="80%"
                  height={48}
                  sx={{ mb: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={120}
                  height={32}
                  sx={{ mb: 4, borderRadius: 10 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={200}
                  sx={{ mb: 3, borderRadius: 2 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={56}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        type="error"
        title="Failed to load item"
        description={error}
        onRetry={handleRetry}
      />
    );
  }

  // Item not found
  if (!item) {
    return (
      <EmptyState
        type="noData"
        title="Item not found"
        description={`No item found with ID: ${id}`}
      />
    );
  }

  const statusConfig = getStatusConfig(item.status);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", pb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" separator="›">
          <Link
            component="button"
            variant="body2"
            onClick={handleBack}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              color: "primary.main",
              fontWeight: 500,
              "&:hover": {
                textDecoration: "underline",
                color: "primary.dark",
              },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
            Back to Items
          </Link>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {item.name}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Content */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          transition: "box-shadow 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Grid
          container
          sx={{
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          {/* Image Section - Fixed Height Container */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              height: { xs: 400, md: 600 },
              minHeight: { xs: 400, md: 600 },
              maxHeight: { xs: 400, md: 600 },
              flexShrink: 0,
              width: { xs: "100%", md: "41.666667%" },
            }}
          >
            <Box
              sx={{
                position: "relative",
                height: "100%",
                width: "100%",
                backgroundColor: "grey.100",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Image with contain objectFit */}
              {item.thumbnailUrl ? (
                <Box
                  component="img"
                  src={item.thumbnailUrl}
                  alt={`${item.name} image`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                /* Fallback Placeholder - Full height container */
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "grey.50",
                    border: "2px dashed",
                    borderColor: "grey.300",
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "8rem",
                      mb: 3,
                      opacity: 0.3,
                      lineHeight: 1,
                    }}
                  >
                    📦
                  </Box>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ mb: 2, opacity: 0.6 }}
                  >
                    No Image Available
                  </Typography>
                  <Chip
                    label={item.category}
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      backgroundColor: "grey.200",
                    }}
                  />
                </Box>
              )}

              {/* Status Badge Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  zIndex: 2,
                }}
              >
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  color={statusConfig.color}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                    backdropFilter: "blur(10px)",
                    backgroundColor:
                      statusConfig.color === "success"
                        ? "rgba(46, 125, 50, 0.95)"
                        : statusConfig.color === "warning"
                          ? "rgba(237, 108, 2, 0.95)"
                          : statusConfig.color === "error"
                            ? "rgba(211, 47, 47, 0.95)"
                            : "rgba(158, 158, 158, 0.95)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Details Section */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{
              width: { xs: "100%", md: "58.333333%" },
              height: { xs: "auto", md: 600 },
              minHeight: { xs: "auto", md: 600 },
              maxHeight: { xs: "none", md: 600 },
              overflow: { xs: "visible", md: "auto" },
              flexShrink: 0,
              // Custom scrollbar styling
              "&::-webkit-scrollbar": {
                width: "12px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "grey.100",
                borderRadius: "0 12px 12px 0",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "grey.400",
                borderRadius: "6px",
                border: "2px solid",
                borderColor: "grey.100",
                "&:hover": {
                  backgroundColor: "grey.500",
                },
              },
              // Firefox scrollbar
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, minHeight: "100%" }}>
              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                    fontWeight: 700,
                    color: "text.primary",
                    mb: 2,
                    lineHeight: 1.2,
                  }}
                >
                  {item.name}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    icon={<QrCodeIcon sx={{ fontSize: 16 }} />}
                    label={`ID: ${item.id}`}
                    size="medium"
                    sx={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      backgroundColor: "primary.main",
                      color: "white",
                      "& .MuiChip-icon": {
                        color: "white",
                      },
                    }}
                  />
                  <Chip
                    icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                    label={item.category}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      borderWidth: 2,
                    }}
                  />
                </Stack>
              </Box>

              <Divider sx={{ mb: 4 }} />

              {/* Information Cards */}
              <Stack spacing={3} sx={{ mb: 4 }}>
                {/* Location Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: "grey.50",
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "primary.50",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LocationIcon
                        sx={{ fontSize: 28, color: "primary.main" }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        textTransform="uppercase"
                        letterSpacing={0.5}
                        sx={{ mb: 0.5, display: "block" }}
                      >
                        Location
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "1.125rem",
                        }}
                      >
                        {item.locationPath}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* QR Code Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: "2px dashed",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    backgroundColor: "primary.50",
                    textAlign: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ mb: 2 }}
                  >
                    <QrCodeIcon sx={{ fontSize: 24, color: "primary.main" }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.dark"
                    >
                      Item QR Code
                    </Typography>
                  </Stack>

                  {/* QR Code Display */}
                  <Box
                    ref={qrCodeRef}
                    sx={{
                      display: "inline-block",
                      p: 2,
                      backgroundColor: "white",
                      borderRadius: 2,
                      mb: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <QRCodeCanvas
                      value={`https://3dlab.e16a.com/item/${item.id}`}
                      size={200}
                      level="H"
                      marginSize={4}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontFamily: "monospace",
                      color: "primary.dark",
                      mb: 1,
                      letterSpacing: 0.5,
                    }}
                  >
                    {item.id}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ mb: 2 }}
                  >
                    Scan to access this item's checkout page
                  </Typography>

                  {/* Download and Print Buttons */}
                  <Stack direction="row" spacing={1.5} justifyContent="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadQR}
                      sx={{
                        fontWeight: 600,
                        textTransform: "none",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintQR}
                      sx={{
                        fontWeight: 600,
                        textTransform: "none",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Print
                    </Button>
                  </Stack>
                </Paper>

                {/* Checkout History Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: "grey.50",
                    border: "1px solid",
                    borderColor: "grey.200",
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <HistoryIcon sx={{ fontSize: 24, color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                      Checkout History
                    </Typography>
                  </Stack>

                  {/* Current Checkout - Highlighted with role-based visibility */}
                  {item.status === "checked_out" && activeCheckout && (
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: "warning.50",
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "warning.200",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="warning.dark"
                        fontWeight={700}
                        sx={{ mb: 1 }}
                      >
                        Currently Checked Out
                      </Typography>
                      <Stack spacing={0.5}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            By:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {/* Admin users see full names, regular users see anonymized for privacy */}
                            {user?.role === "admin"
                              ? activeCheckout.profiles?.full_name ||
                                "Unknown User"
                              : activeCheckout.user_id === user?.id
                                ? activeCheckout.profiles?.full_name || "You"
                                : "Another User"}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Checked out:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(
                              activeCheckout.checkout_date,
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              activeCheckout.checkout_date,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  {/* Historical Checkouts - Role-based visibility */}
                  {checkoutHistory.length > 0 ? (
                    <Stack spacing={1.5}>
                      {checkoutHistory.map((checkout) => (
                        <Box
                          key={checkout.id}
                          sx={{
                            p: 2,
                            backgroundColor: "white",
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                By:
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {/* Admin users see full names, regular users see anonymized */}
                                {user?.role === "admin"
                                  ? checkout.profiles?.full_name ||
                                    "Unknown User"
                                  : "Another User"}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Checked out:
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {new Date(
                                  checkout.checkout_date,
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  checkout.checkout_date,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Returned:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                color="success.main"
                              >
                                {new Date(
                                  checkout.return_date,
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  checkout.return_date,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 2 }}>
                      <HistoryIcon
                        sx={{
                          fontSize: 40,
                          color: "text.disabled",
                          mb: 1,
                          opacity: 0.5,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No checkout history available
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Equipment Technical Details */}
                <EquipmentDetails item={item} />
              </Stack>

              {/* Action Buttons */}
              <Stack spacing={2}>
                {/* Checkout/Return Button - Fixed height container for consistent layout */}
                <Box
                  sx={{
                    minHeight: 72,
                    display: "flex",
                    alignItems: "stretch",
                  }}
                >
                  {item.status === "available" ? (
                    // Show Checkout button for available items
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CheckoutIcon />}
                      onClick={handleOpenCheckoutDialog}
                      fullWidth
                      sx={{
                        py: 2.5,
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        backgroundColor: "success.main",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(46, 125, 50, 0.4)",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "success.dark",
                          boxShadow: "0 6px 20px rgba(46, 125, 50, 0.5)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Check Out This Item
                    </Button>
                  ) : item.status === "checked_out" &&
                    activeCheckout?.user_id === user?.id ? (
                    // Show Return button if current user checked it out
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        <CheckoutIcon sx={{ transform: "rotate(180deg)" }} />
                      }
                      onClick={handleOpenReturnDialog}
                      fullWidth
                      sx={{
                        py: 2.5,
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        backgroundColor: "primary.main",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(30, 58, 138, 0.4)",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                          boxShadow: "0 6px 20px rgba(30, 58, 138, 0.5)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Return This Item
                    </Button>
                  ) : item.status === "checked_out" ? (
                    // Show disabled button if someone else checked it out
                    // Admin users see the name, regular users see "Another User" for privacy
                    <Button
                      variant="contained"
                      size="large"
                      disabled
                      fullWidth
                      sx={{
                        py: 2.5,
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        textTransform: "none",
                        "&.Mui-disabled": {
                          backgroundColor: "grey.300",
                          color: "grey.600",
                        },
                      }}
                    >
                      Checked Out by{" "}
                      {user?.role === "admin"
                        ? activeCheckout?.profiles?.full_name || "Unknown User"
                        : "Another User"}
                    </Button>
                  ) : (
                    // Show disabled button for broken/maintenance status
                    <Button
                      variant="contained"
                      size="large"
                      disabled
                      fullWidth
                      sx={{
                        py: 2.5,
                        fontWeight: 700,
                        fontSize: "1.125rem",
                        textTransform: "none",
                        "&.Mui-disabled": {
                          backgroundColor: "grey.300",
                          color: "grey.600",
                        },
                      }}
                    >
                      Not Available
                    </Button>
                  )}
                </Box>

                {item.amazonLink && (
                  <Button
                    component="a"
                    href={item.amazonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCartIcon />}
                    fullWidth
                    sx={{
                      py: 1.75,
                      fontWeight: 600,
                      fontSize: "1rem",
                      backgroundColor: "#FF9900",
                      color: "#000",
                      boxShadow: "0 2px 8px rgba(255, 153, 0, 0.3)",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#EC7211",
                        boxShadow: "0 4px 16px rgba(255, 153, 0, 0.4)",
                        transform: "translateY(-1px)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    View on Amazon
                  </Button>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<OpenInNewIcon />}
                      onClick={handleOpen3D}
                      fullWidth
                      sx={{
                        py: 1.75,
                        fontWeight: 600,
                        fontSize: "1rem",
                        textTransform: "none",
                        boxShadow: "0 2px 8px rgba(30, 58, 138, 0.2)",
                        "&:hover": {
                          boxShadow: "0 4px 16px rgba(30, 58, 138, 0.3)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Open in 3D
                    </Button>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<ReportProblemIcon />}
                      onClick={handleOpenIssueModal}
                      color="warning"
                      fullWidth
                      sx={{
                        py: 1.75,
                        fontWeight: 600,
                        fontSize: "1rem",
                        textTransform: "none",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Report Issue
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Issue Reporting Modal */}
      <IssueModal
        open={issueModalOpen}
        onClose={handleCloseIssueModal}
        onSuccess={handleIssueSuccess}
        itemId={item.id}
        itemName={item.name}
      />

      {/* Checkout Confirmation Dialog */}
      <Dialog
        open={checkoutDialogOpen}
        onClose={handleCloseCheckoutDialog}
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
          Confirm Check Out
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ mb: 2, fontSize: "1rem", color: "text.primary" }}
          >
            Are you sure you want to check out this item?
          </DialogContentText>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  ITEM NAME
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  ITEM ID
                </Typography>
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  {item.id}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  LOCATION
                </Typography>
                <Typography variant="body1">{item.locationPath}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Alert severity="info" sx={{ mt: 2 }}>
            You will be responsible for this item until it is returned.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={handleCloseCheckoutDialog}
            disabled={checkoutLoading}
            size="large"
            sx={{
              fontWeight: 600,
              textTransform: "none",
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCheckout}
            variant="contained"
            color="success"
            disabled={checkoutLoading}
            size="large"
            startIcon={
              checkoutLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckoutIcon />
              )
            }
            sx={{
              fontWeight: 700,
              textTransform: "none",
              px: 4,
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(46, 125, 50, 0.4)",
              },
            }}
          >
            {checkoutLoading ? "Checking Out..." : "Confirm Check Out"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Confirmation Dialog */}
      <Dialog
        open={returnDialogOpen}
        onClose={handleCloseReturnDialog}
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
          Confirm Return
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ mb: 2, fontSize: "1rem", color: "text.primary" }}
          >
            Are you sure you want to return this item?
          </DialogContentText>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  ITEM NAME
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {item.name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  ITEM ID
                </Typography>
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  fontWeight={600}
                >
                  {item.id}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  LOCATION
                </Typography>
                <Typography variant="body1">{item.locationPath}</Typography>
              </Box>

              {activeCheckout && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    CHECKED OUT ON
                  </Typography>
                  <Typography variant="body1">
                    {new Date(
                      activeCheckout.checkout_date,
                    ).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(
                      activeCheckout.checkout_date,
                    ).toLocaleTimeString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          <Alert severity="success" sx={{ mt: 2 }}>
            This item will become available for others to check out.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={handleCloseReturnDialog}
            disabled={returnLoading}
            size="large"
            sx={{
              fontWeight: 600,
              textTransform: "none",
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReturn}
            variant="contained"
            color="primary"
            disabled={returnLoading}
            size="large"
            startIcon={
              returnLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckoutIcon sx={{ transform: "rotate(180deg)" }} />
              )
            }
            sx={{
              fontWeight: 700,
              textTransform: "none",
              px: 4,
              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.3)",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(30, 58, 138, 0.4)",
              },
            }}
          >
            {returnLoading ? "Returning..." : "Confirm Return"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          elevation={6}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ItemDetail;
