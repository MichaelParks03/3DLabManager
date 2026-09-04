import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Toolbar,
  Checkbox,
  Snackbar,
  Alert,
  Paper,
  Stack,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewInAr as ViewInArIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../../lib/supabaseItems";
import { getLabs } from "../../lib/supabaseLabs";
import { uploadEquipmentThumbnail } from "../../lib/supabaseStorage";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "../../shared/types";

const ItemsAdmin = () => {
  const [items, setItems] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLab, setFilterLab] = useState("all");
  const [selected, setSelected] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    status: "available",
    labId: "",
    locationPath: "",
    thumbnailUrl: "",
    amazonLink: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getEquipment({
        q: search,
        category: filterCategory,
        status: filterStatus,
        labId: filterLab !== "all" ? filterLab : null,
      });
      setItems(data);
    } catch (error) {
      console.error("Failed to load items:", error);
      showSnackbar("Failed to load items", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const data = await getLabs();
      setLabs(data);
    } catch (error) {
      console.error("Failed to load labs:", error);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory, filterStatus, filterLab]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(items.map((item) => item.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleMenuOpen = (event, item) => {
    setMenuAnchor(event.currentTarget);
    setCurrentItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    // Don't clear currentItem here - it's needed for edit mode
  };

  const handleAddClick = () => {
    setFormData({
      id: "",
      name: "",
      category: "Tool",
      status: "available",
      labId: "",
      locationPath: "",
      thumbnailUrl: "",
      amazonLink: "",
    });
    setFormErrors({});
    setCurrentItem(null);
    setSelectedImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const handleEditClick = () => {
    setFormData({
      id: currentItem.id,
      name: currentItem.name,
      category: currentItem.category,
      status: currentItem.status,
      labId: currentItem.labId || "",
      locationPath: currentItem.locationPath || "",
      thumbnailUrl: currentItem.thumbnailUrl || "",
      amazonLink: currentItem.amazonLink || "",
    });
    setFormErrors({});
    setSelectedImageFile(null);
    setImagePreview(currentItem.thumbnailUrl || null);
    handleMenuClose();
    setDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setItemToDelete(currentItem);
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentItem(null);
    setMenuAnchor(null); // Also close menu if it's still open
    setFormErrors({});
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, thumbnailUrl: "" });
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.id.trim()) {
      errors.id = "QR Code is required";
    }
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formData.category) {
      errors.category = "Category is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let thumbnailUrl = formData.thumbnailUrl;

      // Upload image if a new one was selected
      if (selectedImageFile) {
        setUploadingImage(true);
        const uploadResult = await uploadEquipmentThumbnail(selectedImageFile);

        if (!uploadResult.success) {
          showSnackbar(uploadResult.error || "Failed to upload image", "error");
          setUploadingImage(false);
          return;
        }

        thumbnailUrl = uploadResult.url;
        setUploadingImage(false);
      }

      const itemData = {
        id: formData.id,
        name: formData.name,
        category: formData.category,
        status: formData.status,
        locationPath: formData.locationPath,
        thumbnailUrl: thumbnailUrl,
        amazonLink: formData.amazonLink,
        labId: formData.labId || null,
      };

      if (currentItem) {
        await updateEquipment(currentItem.id, itemData);
        showSnackbar("Item updated successfully", "success");
      } else {
        await createEquipment(itemData);
        showSnackbar("Item created successfully", "success");
      }

      fetchItems();
      handleDialogClose();
    } catch (error) {
      console.error("Failed to save item:", error);
      showSnackbar(error.message || "Failed to save item", "error");
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteEquipment(itemToDelete.id);
      showSnackbar("Item deleted successfully", "success");
      fetchItems();
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Failed to delete item:", error);
      showSnackbar(error.message || "Failed to delete item", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  const getStatusLabel = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredItems = items;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Items Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage equipment inventory and 3D models
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          aria-label="Add new item"
        >
          Add Item
        </Button>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" } }}>
          <TextField
            placeholder="Search items..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ minWidth: { xs: "100%", sm: 250 } }}
            aria-label="Search items"
          />
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {ITEM_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {ITEM_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
            <InputLabel>Lab</InputLabel>
            <Select
              value={filterLab}
              label="Lab"
              onChange={(e) => setFilterLab(e.target.value)}
            >
              <MenuItem value="all">All Labs</MenuItem>
              {labs.map((lab) => (
                <MenuItem key={lab.id} value={lab.id}>
                  {lab.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Toolbar>
      </Card>

      {/* Table */}
      {loading ? (
        <Typography>Loading items...</Typography>
      ) : (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer>
            <Table aria-label="Items table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selected.length > 0 && selected.length < items.length
                      }
                      checked={
                        items.length > 0 && selected.length === items.length
                      }
                      onChange={handleSelectAll}
                      inputProps={{ "aria-label": "Select all items" }}
                    />
                  </TableCell>
                  <TableCell>QR Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Category</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Lab</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>3D Model</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No items found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow
                        key={item.id}
                        hover
                        selected={selected.includes(item.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.includes(item.id)}
                            onChange={() => handleSelect(item.id)}
                            inputProps={{ "aria-label": `Select ${item.name}` }}
                          />
                        </TableCell>
                        <TableCell>{item.id}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {item.name}
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{item.category}</TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          {item.labId
                            ? labs.find((l) => l.id === item.labId)?.name ||
                              item.labId
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.status)}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          {item.modelPath ? (
                            <Chip
                              icon={<ViewInArIcon />}
                              label="Yes"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, item)}
                            aria-label={`Actions for ${item.name}`}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{currentItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="QR Code"
                    fullWidth
                    required
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    error={!!formErrors.id}
                    helperText={
                      formErrors.id || "Unique identifier for the item"
                    }
                    disabled={!!currentItem}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    fullWidth
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!formErrors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {ITEM_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      {ITEM_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Location Path"
                    fullWidth
                    value={formData.locationPath}
                    onChange={(e) =>
                      setFormData({ ...formData, locationPath: e.target.value })
                    }
                    placeholder="e.g., Senior Lab › North Bench"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Item Thumbnail
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        disabled={uploadingImage}
                      >
                        Upload Image
                        <input
                          type="file"
                          hidden
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageSelect}
                        />
                      </Button>
                      {imagePreview && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="img"
                            src={imagePreview}
                            alt="Thumbnail preview"
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                          <Button
                            size="small"
                            color="error"
                            onClick={handleRemoveImage}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      JPG, PNG, or WebP (max 5MB)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Thumbnail URL (Optional)"
                    fullWidth
                    value={formData.thumbnailUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnailUrl: e.target.value })
                    }
                    placeholder="/images/items/item.png"
                    helperText="Or enter a URL directly if not uploading"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Amazon Link"
                    fullWidth
                    value={formData.amazonLink}
                    onChange={(e) =>
                      setFormData({ ...formData, amazonLink: e.target.value })
                    }
                    placeholder="https://amazon.com/..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Lab</InputLabel>
                    <Select
                      value={formData.labId}
                      label="Lab"
                      onChange={(e) =>
                        setFormData({ ...formData, labId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {labs.map((lab) => (
                        <MenuItem key={lab.id} value={lab.id}>
                          {lab.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={uploadingImage}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={uploadingImage}>
            {uploadingImage ? "Uploading..." : currentItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{itemToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemsAdmin;
