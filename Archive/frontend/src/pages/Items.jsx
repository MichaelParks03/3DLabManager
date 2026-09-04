import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  Chip,
  Stack,
} from "@mui/material";
import {
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";

// API and constants
//import { itemsApi } from "../lib/api.js";
import { getEquipment } from "../lib/supabaseItems.js";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "../shared/types.js";

// Components
import SearchBar from "../components/SearchBar.jsx";
import ItemCard from "../components/ItemCard.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";

/**
 * Items Page Component
 * Complete inventory management interface with search, filters, and grid/list views
 * Implements URL state persistence and proper loading/error states
 */
function Items() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeSearchQuery, setActiveSearchQuery] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [viewMode, setViewMode] = useState("grid");

  // Fetch items function
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch filtered results directly from Supabase
      const data = await getEquipment({
        q: activeSearchQuery,
        category: categoryFilter,
        status: statusFilter,
      });

      setItems(data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setError("Failed to load items from database.");
    } finally {
      setLoading(false);
    }
  }, [activeSearchQuery, categoryFilter, statusFilter]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (activeSearchQuery) params.set("q", activeSearchQuery);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);

    setSearchParams(params);
  }, [activeSearchQuery, categoryFilter, statusFilter, setSearchParams]);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter handlers
  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
  };

  const handleCategoryChange = (event) => {
    setCategoryFilter(event.target.value);
  };

  const handleStatusChange = (_, newStatus) => {
    if (newStatus !== null) {
      setStatusFilter(newStatus);
    }
  };

  const handleViewModeChange = (_, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleRetry = () => {
    fetchItems();
  };

  const handleCloseError = () => {
    setError(null);
  };

  // Get active filter count for display
  const activeFilterCount = [
    activeSearchQuery,
    categoryFilter !== "all" ? categoryFilter : null,
    statusFilter !== "all" ? statusFilter : null,
  ].filter(Boolean).length;

  // Format status for display
  const formatStatus = (status) => {
    return status.replace("_", " ").toUpperCase();
  };

  // Get status color for chips (same as ItemCard)
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success";
      case "checked_out":
        return "warning";
      case "broken":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            fontWeight: 700,
            color: "primary.main",
            mb: 1,
          }}
        >
          Lab Inventory
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontSize: "1rem",
          }}
        >
          Search and manage equipment in the Senior Design Engineering Lab
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4, width: "100%" }}>
        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>

        {/* Filters and Controls */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* Filter Controls */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              flex: 1,
            }}
          >
            {/* Category Filter */}
            <FormControl
              size="medium"
              sx={{ minWidth: 140 }}
              disabled={loading}
            >
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                onChange={handleCategoryChange}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {ITEM_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Status Filter */}
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={handleStatusChange}
              disabled={loading}
              sx={{
                "& .MuiToggleButton-root": {
                  px: 2,
                  py: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="all" aria-label="all statuses">
                All
              </ToggleButton>
              {ITEM_STATUSES.map((status) => (
                <ToggleButton
                  key={status}
                  value={status}
                  aria-label={`filter by ${status}`}
                >
                  {formatStatus(status)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="medium"
            disabled={loading}
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <FilterListIcon
                sx={{ color: "text.secondary", fontSize: "1.25rem" }}
              />
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mr: 1 }}
              >
                Active filters:
              </Typography>

              {activeSearchQuery && (
                <Chip
                  label={`Search: "${activeSearchQuery}"`}
                  size="small"
                  onDelete={handleSearchClear}
                  color="primary"
                  variant="outlined"
                />
              )}

              {categoryFilter !== "all" && (
                <Chip
                  label={`Category: ${categoryFilter}`}
                  size="small"
                  onDelete={() => setCategoryFilter("all")}
                  color="primary"
                  variant="outlined"
                />
              )}

              {statusFilter !== "all" && (
                <Chip
                  label={`Status: ${formatStatus(statusFilter)}`}
                  size="small"
                  onDelete={() => setStatusFilter("all")}
                  color="primary"
                  variant="outlined"
                />
              )}

              <Chip
                label="Clear all"
                size="small"
                onClick={clearAllFilters}
                color="secondary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Results Section */}
      <Box
        sx={{
          width: viewMode === "list" ? "100vw" : "100%",
          ml: viewMode === "list" ? { xs: -2, sm: -3, md: -4 } : 0,
          px: viewMode === "list" ? { xs: 2, sm: 3, md: 4 } : 0,
          overflow: "hidden",
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Results Count */}
        {!loading && !error && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
              fontSize: "0.875rem",
              flexShrink: 0,
            }}
          >
            {items.length === 0
              ? "No items found"
              : `${items.length} item${items.length === 1 ? "" : "s"} found`}
          </Typography>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <LoadingSkeleton count={6} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <EmptyState
              type="error"
              description={error}
              onRetry={handleRetry}
              onClear={activeFilterCount > 0 ? clearAllFilters : null}
            />
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <EmptyState
              type={activeFilterCount > 0 ? "empty" : "noData"}
              onClear={activeFilterCount > 0 ? clearAllFilters : null}
            />
          </Box>
        )}

        {/* Items Grid / List */}
        {!loading &&
          !error &&
          items.length > 0 &&
          (viewMode === "grid" ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                  xl: "repeat(6, 1fr)",
                },
                gap: 2,
                width: "100%",
                alignItems: "stretch",
                overflowY: "auto",
              }}
            >
              {items.map((item) => (
                <Box key={item.id} sx={{ display: "flex" }}>
                  <ItemCard item={item} />
                </Box>
              ))}
            </Box>
          ) : (
            // List view: fill height and allow scrolling
            <Box
              sx={{ flex: 1, minHeight: 0, display: "flex", overflowY: "auto" }}
            >
              <Stack spacing={1.5} sx={{ width: "100%", flex: 1 }}>
                {items.map((item) => (
                  <Box
                    component={Link}
                    to={`/item/${item.id}`}
                    key={item.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      width: "100%",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: 2,
                        borderColor: "primary.light",
                        textDecoration: "none",
                      },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: "2px",
                      },
                    }}
                  >
                    {/* Thumbnail with same styling as card view */}
                    <Box
                      sx={{
                        flex: "0 0 80px",
                        height: 80,
                        borderRadius: 1,
                        bgcolor: "grey.100",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        component="img"
                        src={item.thumbnailUrl}
                        alt={`${item.name} thumbnail`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      {/* Fallback icon */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "text.secondary",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: "1.5rem",
                            opacity: 0.6,
                          }}
                        >
                          📦
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.65rem", mt: 0.5 }}
                        >
                          {item.category}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item ID and Name */}
                    <Box
                      sx={{
                        flexGrow: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.id}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name || item.title || `Item ${item.id}`}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip
                          label={item.category || "Uncategorized"}
                          variant="outlined"
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      </Box>
                    </Box>

                    {/* Location */}
                    <Box
                      sx={{
                        display: { xs: "none", md: "flex" },
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 200,
                        maxWidth: 250,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: "1rem",
                          color: "text.secondary",
                          flexShrink: 0,
                        }}
                      >
                        📍
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.locationPath}
                      </Typography>
                    </Box>

                    {/* Amazon Link Button (if available) */}
                    {item.amazonLink && (
                      <Box
                        sx={{
                          display: { xs: "none", lg: "block" },
                          minWidth: 150,
                        }}
                      >
                        <Box
                          component="a"
                          href={item.amazonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} // Prevent card click
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                            py: 0.75,
                            px: 1.5,
                            backgroundColor: "#FF9900",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: 1,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            transition: "all 0.2s",
                            "&:hover": {
                              backgroundColor: "#EC7211",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <ShoppingCartIcon sx={{ fontSize: "0.875rem" }} />
                          View on Amazon
                        </Box>
                      </Box>
                    )}

                    {/* Status and View Details */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 1,
                        minWidth: 120,
                      }}
                    >
                      {item.status && (
                        <Chip
                          label={formatStatus(item.status)}
                          color={getStatusColor(item.status)}
                          size="small"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        View Details →
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Items;
