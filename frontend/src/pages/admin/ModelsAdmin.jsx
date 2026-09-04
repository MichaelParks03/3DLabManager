import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  RadioButtonUnchecked as NoModelIcon,
  Search as SearchIcon,
  Shuffle as ShuffleIcon,
  ViewInAr as ViewInArIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { getEquipment, updateEquipment } from "../../lib/supabaseItems";
import { getLabs } from "../../lib/supabaseLabs";
import { uploadItemModel } from "../../lib/supabaseStorage";
import { ITEM_CATEGORIES } from "../../shared/types";

const generateRandomCoords = () => ({
  x: parseFloat((Math.random() * 6 - 3).toFixed(2)), // -3 to +3 (smaller range, closer to center)
  y: 0, // Floor level
  z: parseFloat((Math.random() * 6 - 3).toFixed(2)), // -3 to +3
  rotX: 0,
  rotY: 0,
  rotZ: 0,
});

const emptyForm = () => {
  const coords = generateRandomCoords();
  return { scale: 1, ...coords, labId: "" };
};

const ModelsAdmin = () => {
  const [items, setItems] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preSelectedItem, setPreSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [modelFile, setModelFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const [labAssignDialogOpen, setLabAssignDialogOpen] = useState(false);
  const [itemToAssignLab, setItemToAssignLab] = useState(null);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [labAssignSaving, setLabAssignSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemData, labData] = await Promise.all([
        getEquipment({}),
        getLabs(),
      ]);
      setItems(itemData);
      setLabs(labData);
    } catch {
      showSnackbar("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Dialog open/close ─── */
  const handleOpenDialog = (item = null) => {
    const coords = generateRandomCoords();
    if (item) {
      setPreSelectedItem(item);
      setSelectedItemId(item.id);
      setFormData({
        scale: item.scale ?? 1,
        x: item.x ?? coords.x,
        y: item.y ?? coords.y,
        z: item.z ?? coords.z,
        rotX: item.rotX ?? 0,
        rotY: item.rotY ?? 0,
        rotZ: item.rotZ ?? 0,
        labId: item.labId || "",
      });
    } else {
      setPreSelectedItem(null);
      setSelectedItemId("");
      setFormData({ scale: 1, ...coords, labId: "" });
    }
    setModelFile(null);
    setIsDragging(false);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPreSelectedItem(null);
    setSelectedItemId("");
    setModelFile(null);
    setFormErrors({});
  };

  /* ─── Lab Assignment Dialog ─── */
  const handleOpenLabAssignDialog = (item) => {
    setItemToAssignLab(item);
    setSelectedLabId(item.labId || "");
    setLabAssignDialogOpen(true);
  };

  const handleCloseLabAssignDialog = () => {
    setLabAssignDialogOpen(false);
    setItemToAssignLab(null);
    setSelectedLabId("");
  };

  const handleSaveLabAssignment = async () => {
    if (!itemToAssignLab) return;

    setLabAssignSaving(true);
    try {
      await updateEquipment(itemToAssignLab.id, {
        labId: selectedLabId || null,
      });

      // Update the item in state directly (optimistic update - faster than refetching)
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemToAssignLab.id
            ? { ...item, labId: selectedLabId || null }
            : item
        )
      );

      showSnackbar("Lab assignment saved successfully", "success");
      handleCloseLabAssignDialog();
    } catch (err) {
      showSnackbar(err.message || "Failed to save lab assignment", "error");
    } finally {
      setLabAssignSaving(false);
    }
  };

  /* ─── Equipment selector in dialog ─── */
  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const coords = generateRandomCoords();
      setFormData({
        scale: item.scale ?? 1,
        x: item.x ?? coords.x,
        y: item.y ?? coords.y,
        z: item.z ?? coords.z,
        rotX: item.rotX ?? 0,
        rotY: item.rotY ?? 0,
        rotZ: item.rotZ ?? 0,
        labId: item.labId || "",
      });
    }
    setFormErrors((prev) => ({ ...prev, item: null }));
  };

  /* ─── Drag & Drop ─── */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };
  const handleFileInput = (e) => {
    processFile(e.target.files[0]);
    e.target.value = null;
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb")) {
      showSnackbar("Only .glb files are allowed", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showSnackbar(
        `File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max 10 MB.`,
        "error"
      );
      return;
    }
    setModelFile(file);
    setFormErrors((prev) => ({ ...prev, modelFile: null }));
  };

  /* ─── Randomize coordinates ─── */
  const handleRandomize = () => {
    const coords = generateRandomCoords();
    setFormData((prev) => ({ ...prev, ...coords }));
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    const errors = {};
    const targetItem =
      preSelectedItem || items.find((i) => i.id === selectedItemId);
    if (!targetItem) errors.item = "Please select an equipment item";
    if (!formData.labId) {
      errors.labId = "Lab assignment is required before uploading a 3D model";
    }
    if (!modelFile && !targetItem?.modelPath)
      errors.modelFile = "Please upload a .glb file";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setUploading(true);
    try {
      let modelPath = targetItem.modelPath || "";
      if (modelFile) {
        const result = await uploadItemModel(modelFile);
        if (!result.success) {
          showSnackbar(`Upload failed: ${result.error}`, "error");
          return;
        }
        modelPath = result.url;
      }

      await updateEquipment(targetItem.id, {
        modelPath,
        scale: parseFloat(formData.scale) || 1,
        x: parseFloat(formData.x) || 0,
        y: parseFloat(formData.y) || 0,
        z: parseFloat(formData.z) || 0,
        rotX: parseFloat(formData.rotX) || 0,
        rotY: parseFloat(formData.rotY) || 0,
        rotZ: parseFloat(formData.rotZ) || 0,
        labId: formData.labId,
      });

      showSnackbar("3D model saved successfully", "success");
      fetchData();
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.message || "Failed to save model", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ─── Remove model ─── */
  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    try {
      await updateEquipment(itemToRemove.id, {
        modelPath: null,
        scale: null,
        x: null,
        y: null,
        z: null,
        rotX: null,
        rotY: null,
        rotZ: null,
      });
      showSnackbar("3D model removed", "success");
      fetchData();
    } catch {
      showSnackbar("Failed to remove model", "error");
    } finally {
      setDeleteDialogOpen(false);
      setItemToRemove(null);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getLabName = (labId) =>
    labs.find((l) => l.id === labId)?.name || labId;

  const positionLabel = (item) => {
    if (item.x == null) return "—";
    return `(${item.x}, ${item.y}, ${item.z})`;
  };

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.labId &&
        getLabName(item.labId).toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const withModels = filteredItems.filter((i) => i.modelPath);
  const withoutModels = filteredItems.filter((i) => !i.modelPath);
  const unassignedItems = filteredItems.filter((i) => !i.labId);

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            3D Models
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Upload &amp; manage 3D models for lab equipment
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Upload 3D Model
        </Button>
      </Box>

      {/* ── Warning: Items Without Lab Assignment ── */}
      {!loading && unassignedItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {unassignedItems.length} item
                {unassignedItems.length !== 1 ? "s" : ""} without lab assignment
              </Typography>
              <Typography variant="body2">
                Items must be assigned to a lab before uploading a 3D model. You
                can assign labs in the table below or in Items Admin.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearch("");
                setFilterCategory("all");
                document.querySelector("table")?.scrollIntoView({ behavior: "smooth" });
              }}
              sx={{ whiteSpace: "nowrap" }}
            >
              View Unassigned Items
            </Button>
          </Box>
        </Alert>
      )}

      {/* ── Stats ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Items", value: items.length, color: "primary.main" },
          {
            label: "With 3D Model",
            value: withModels.length,
            color: "success.main",
          },
          {
            label: "No 3D Model",
            value: withoutModels.length,
            color: "warning.main",
          },
        ].map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: stat.color }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Search and Filters ── */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search by item name, QR code, category, or lab..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
        </Box>
      </Card>

      {/* ── Table ── */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Paper>
          <TableContainer>
            <Table aria-label="3D models table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>QR Code</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>Lab</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>3D Model</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>
                    Position (X, Y, Z)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>Scale</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <ViewInArIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                      />
                      <Typography color="text.secondary">
                        No items found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        bgcolor: !item.labId ? "warning.lighter" : "inherit",
                        "&:hover": {
                          bgcolor: !item.labId ? "warning.light" : "action.hover",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "monospace",
                            bgcolor: "action.hover",
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                          }}
                        >
                          {item.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        {item.labId ? (
                          getLabName(item.labId)
                        ) : (
                          <Chip
                            label="No Lab"
                            size="small"
                            color="warning"
                            variant="outlined"
                            icon={<WarningIcon />}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.modelPath ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Uploaded"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            icon={<NoModelIcon />}
                            label="None"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {positionLabel(item)}
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        {item.scale ?? "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {!item.labId && (
                            <Tooltip title="Assign Lab">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleOpenLabAssignDialog(item)}
                                aria-label={`Assign lab for ${item.name}`}
                              >
                                <AssignmentIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip
                            title={item.modelPath ? "Edit Model" : "Upload Model"}
                          >
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(item)}
                              aria-label={`Upload model for ${item.name}`}
                            >
                              {item.modelPath ? <EditIcon /> : <ViewInArIcon />}
                            </IconButton>
                          </Tooltip>
                          {item.modelPath && (
                            <Tooltip title="Remove Model">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setItemToRemove(item);
                                  setDeleteDialogOpen(true);
                                }}
                                aria-label={`Remove model for ${item.name}`}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Upload / Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {preSelectedItem?.modelPath
            ? `Edit 3D Model — ${preSelectedItem.name}`
            : preSelectedItem
            ? `Upload 3D Model — ${preSelectedItem.name}`
            : "Upload 3D Model"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Equipment Selector (only when not opened from a row) */}
            {!preSelectedItem && (
              <FormControl fullWidth error={!!formErrors.item} required>
                <InputLabel>Equipment Item</InputLabel>
                <Select
                  value={selectedItemId}
                  label="Equipment Item"
                  onChange={(e) => handleItemSelect(e.target.value)}
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <Typography sx={{ flex: 1 }}>{item.name}</Typography>
                        {item.modelPath && (
                          <Chip
                            label="Has model"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.item && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.75 }}
                  >
                    {formErrors.item}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* ── Lab Assignment (Editable) ── */}
            <FormControl fullWidth required error={!!formErrors.labId}>
              <InputLabel>Lab Assignment</InputLabel>
              <Select
                value={formData.labId}
                label="Lab Assignment"
                onChange={(e) => {
                  setFormData({ ...formData, labId: e.target.value });
                  setFormErrors((prev) => ({ ...prev, labId: null }));
                }}
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
              {formErrors.labId && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {formErrors.labId}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, ml: 1.75 }}
              >
                Required before uploading a 3D model. Items without lab
                assignment cannot have models.
              </Typography>
            </FormControl>

            {/* ── Drag & Drop Upload Zone ── */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                3D Model File (.glb)
                {!preSelectedItem?.modelPath && " *"}
              </Typography>

              <Paper
                variant="outlined"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: isDragging
                    ? "primary.main"
                    : formErrors.modelFile
                    ? "error.main"
                    : "divider",
                  bgcolor: isDragging ? "primary.50" : "background.default",
                  transition: "border-color 0.2s, background-color 0.2s",
                  "&:hover": {
                    borderColor: "primary.light",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb"
                  hidden
                  onChange={handleFileInput}
                />
                <ViewInArIcon
                  sx={{
                    fontSize: 48,
                    color: isDragging ? "primary.main" : "text.secondary",
                    mb: 1,
                    transition: "color 0.2s",
                  }}
                />
                <Typography
                  variant="body2"
                  color={isDragging ? "primary.main" : "text.secondary"}
                >
                  {modelFile ? (
                    <>
                      <strong>{modelFile.name}</strong>
                      <br />({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                    </>
                  ) : preSelectedItem?.modelPath ? (
                    <>
                      Current:{" "}
                      <strong>
                        {preSelectedItem.modelPath.split("/").pop()}
                      </strong>
                      <br />
                      Drag &amp; drop or click to replace
                    </>
                  ) : isDragging ? (
                    <strong>Drop your .glb file here!</strong>
                  ) : (
                    <>
                      Drag &amp; drop or click to upload
                      <br />
                      GLB files only (max 10 MB)
                    </>
                  )}
                </Typography>
                {uploading && <LinearProgress sx={{ mt: 2 }} />}
              </Paper>

              {formErrors.modelFile && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75, display: "block" }}
                >
                  {formErrors.modelFile}
                </Typography>
              )}
            </Box>

            {/* ── Scale ── */}
            <TextField
              label="Scale"
              type="number"
              inputProps={{ step: 0.1, min: 0.01 }}
              value={formData.scale}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, scale: e.target.value }))
              }
              helperText="Visual size of the model in the lab (default: 1)"
              fullWidth
            />

            {/* ── Position & Rotation ── */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Position &amp; Rotation
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShuffleIcon />}
                  onClick={handleRandomize}
                >
                  Randomize
                </Button>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                Coordinates are auto-generated. You can fine-tune them later by
                dragging the item inside the 3D lab view.
              </Typography>

              <Grid container spacing={2}>
                {[
                  { key: "x", label: "X Position" },
                  { key: "y", label: "Y Position" },
                  { key: "z", label: "Z Position" },
                  { key: "rotX", label: "X Rotation" },
                  { key: "rotY", label: "Y Rotation" },
                  { key: "rotZ", label: "Z Rotation" },
                ].map(({ key, label }) => (
                  <Grid item xs={4} key={key}>
                    <TextField
                      label={label}
                      type="number"
                      inputProps={{ step: 0.1 }}
                      size="small"
                      fullWidth
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CloudUploadIcon /> : null}
          >
            {uploading ? "Uploading…" : "Save Model"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Remove Confirmation ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove 3D Model</DialogTitle>
        <DialogContent>
          <Typography>
            Remove the 3D model from{" "}
            <strong>{itemToRemove?.name}</strong>? The equipment record will
            remain but its model data will be cleared.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmRemove}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Lab Assignment Dialog ── */}
      <Dialog
        open={labAssignDialogOpen}
        onClose={labAssignSaving ? undefined : handleCloseLabAssignDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Lab</DialogTitle>
        {labAssignSaving && <LinearProgress />}
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assign a lab to <strong>{itemToAssignLab?.name}</strong>
            </Typography>
            <FormControl fullWidth disabled={labAssignSaving}>
              <InputLabel>Lab</InputLabel>
              <Select
                value={selectedLabId}
                label="Lab"
                onChange={(e) => setSelectedLabId(e.target.value)}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLabAssignDialog} disabled={labAssignSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLabAssignment}
            variant="contained"
            color="primary"
            disabled={labAssignSaving}
            startIcon={labAssignSaving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {labAssignSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModelsAdmin;
