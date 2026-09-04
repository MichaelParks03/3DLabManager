import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Chip,
  Stack,
  Snackbar,
  Alert,
  IconButton,
  CardMedia,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Science as ScienceIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  ViewInAr as ViewInArIcon,
} from "@mui/icons-material";
import {
  getLabs,
  createLab,
  updateLab,
  deleteLab,
} from "../../lib/supabaseLabs";
import { uploadLabModel, uploadLabThumbnail } from "../../lib/supabaseStorage";

const LabsAdmin = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentLab, setCurrentLab] = useState(null);
  const [labToDelete, setLabToDelete] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    labCode: "",
    blurb: "",
    modelPath: "",
    thumbnailUrl: "",
  });
  const [modelFile, setModelFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    model: false,
    thumbnail: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchLabs = async () => {
    setLoading(true);
    try {
      const data = await getLabs();
      setLabs(data);
    } catch (error) {
      console.error("Failed to load labs:", error);
      showSnackbar("Failed to load labs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddClick = () => {
    setCurrentLab(null);
    setFormData({
      id: "",
      name: "",
      labCode: "",
      blurb: "",
      modelPath: "",
      thumbnailUrl: "",
    });
    setModelFile(null);
    setThumbnailFile(null);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEditClick = (lab) => {
    setCurrentLab(lab);
    setFormData({
      id: lab.id,
      name: lab.name,
      labCode: lab.labCode || "",
      blurb: lab.blurb || "",
      modelPath: lab.modelPath || "",
      thumbnailUrl: lab.thumbnailUrl || "",
    });
    setModelFile(null);
    setThumbnailFile(null);
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDeleteClick = (lab) => {
    setLabToDelete(lab);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentLab(null);
    setModelFile(null);
    setThumbnailFile(null);
    setFormErrors({});
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setLabToDelete(null);
  };

  const handleModelFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith(".glb")) {
        showSnackbar("Please select a .glb file", "error");
        event.target.value = null; // Reset input
        return;
      }

      // Validate file size (10MB limit based on 25GB total server storage)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        showSnackbar(
          `File size (${fileSizeMB} MB) exceeds the maximum limit of 10 MB. Please compress your model or choose a smaller file.`,
          "error"
        );
        event.target.value = null; // Reset input
        return;
      }

      setModelFile(file);
      setFormErrors({ ...formErrors, modelPath: null });
    }
  };

  const handleThumbnailFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        showSnackbar("Please select a JPG, PNG, or WebP image", "error");
        return;
      }
      setThumbnailFile(file);
      setFormErrors({ ...formErrors, thumbnailUrl: null });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.id.trim()) {
      errors.id = "Lab ID is required";
    }
    if (!formData.name.trim()) {
      errors.name = "Lab name is required";
    }
    if (!formData.labCode.trim()) {
      errors.labCode = "Lab code is required";
    }
    if (!formData.blurb.trim()) {
      errors.blurb = "Description is required";
    }

    // For new labs, require file uploads
    if (!currentLab) {
      if (!modelFile) {
        errors.modelPath = "3D model file is required";
      }
      if (!thumbnailFile) {
        errors.thumbnailUrl = "Thumbnail image is required";
      }
    } else {
      // For updates, files are optional (keep existing if not provided)
      if (!modelFile && !formData.modelPath) {
        errors.modelPath = "3D model is required";
      }
      if (!thumbnailFile && !formData.thumbnailUrl) {
        errors.thumbnailUrl = "Thumbnail is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      let modelPath = formData.modelPath;
      let thumbnailUrl = formData.thumbnailUrl;

      // Upload model file if new file selected
      if (modelFile) {
        setUploadProgress({ ...uploadProgress, model: true });
        const modelResult = await uploadLabModel(modelFile);
        if (!modelResult.success) {
          showSnackbar(`Model upload failed: ${modelResult.error}`, "error");
          setUploading(false);
          setUploadProgress({ ...uploadProgress, model: false });
          return;
        }
        modelPath = modelResult.url;
      }

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        setUploadProgress({ ...uploadProgress, thumbnail: true });
        const thumbnailResult = await uploadLabThumbnail(thumbnailFile);
        if (!thumbnailResult.success) {
          showSnackbar(
            `Thumbnail upload failed: ${thumbnailResult.error}`,
            "error"
          );
          setUploading(false);
          setUploadProgress({ ...uploadProgress, thumbnail: false });
          return;
        }
        thumbnailUrl = thumbnailResult.url;
      }

      // Create or update lab with uploaded URLs
      const labData = {
        id: formData.id,
        name: formData.name,
        labCode: formData.labCode,
        blurb: formData.blurb,
        modelPath,
        thumbnailUrl,
      };

      if (currentLab) {
        await updateLab(currentLab.id, labData);
        showSnackbar("Lab updated successfully", "success");
      } else {
        await createLab(labData);
        showSnackbar("Lab created successfully", "success");
      }

      fetchLabs();
      handleDialogClose();
    } catch (error) {
      console.error("Failed to save lab:", error);
      showSnackbar(error.message || "Failed to save lab", "error");
    } finally {
      setUploading(false);
      setUploadProgress({ model: false, thumbnail: false });
    }
  };

  const handleDelete = async () => {
    if (!labToDelete) return;

    try {
      await deleteLab(labToDelete.id);
      showSnackbar("Lab deleted successfully", "success");
      fetchLabs();
      handleDeleteDialogClose();
    } catch (error) {
      console.error("Failed to delete lab:", error);
      showSnackbar(error.message || "Failed to delete lab", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Labs Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage lab spaces and 3D models
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          aria-label="Add new lab"
        >
          Add Lab
        </Button>
      </Box>

      {/* Labs Grid */}
      {loading ? (
        <Typography>Loading labs...</Typography>
      ) : labs.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <CardContent>
            <ScienceIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No labs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by adding your first lab
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Lab
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {labs.map((lab) => (
            <Grid item xs={12} sm={6} md={4} key={lab.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {lab.thumbnailUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={lab.thumbnailUrl}
                    alt={lab.name}
                    sx={{ objectFit: "cover" }}
                  />
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ScienceIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ fontWeight: 600 }}
                    >
                      {lab.name}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {lab.blurb}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`ID: ${lab.id}`}
                      size="small"
                      variant="outlined"
                    />
                    {lab.modelPath && (
                      <Chip label="3D Model" size="small" color="success" />
                    )}
                  </Stack>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditClick(lab)}
                    aria-label={`Edit ${lab.name}`}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(lab)}
                    aria-label={`Delete ${lab.name}`}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{currentLab ? "Edit Lab" : "Add New Lab"}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Lab ID"
              fullWidth
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              error={!!formErrors.id}
              helperText={formErrors.id || "e.g., erb_202"}
              disabled={!!currentLab}
              required
            />
            <TextField
              label="Lab Name"
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!formErrors.name}
              helperText={formErrors.name || "e.g., ERB 202"}
              required
            />
            <TextField
              label="Lab Code"
              fullWidth
              value={formData.labCode}
              onChange={(e) =>
                setFormData({ ...formData, labCode: e.target.value })
              }
              error={!!formErrors.name}
              helperText={formErrors.name || "e.g., 202"}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.blurb}
              onChange={(e) =>
                setFormData({ ...formData, blurb: e.target.value })
              }
              error={!!formErrors.blurb}
              helperText={formErrors.blurb || "e.g., Senior Design Lab"}
              required
            />

            {/* 3D Model File Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                3D Model File (.glb) *
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2, md: 3 },
                  textAlign: "center",
                  borderStyle: "dashed",
                  borderColor: formErrors.modelPath ? "error.main" : "divider",
                  bgcolor: "background.default",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() =>
                  document.getElementById("model-file-input").click()
                }
              >
                <input
                  id="model-file-input"
                  type="file"
                  accept=".glb"
                  hidden
                  onChange={handleModelFileChange}
                />
                <ViewInArIcon
                  sx={{ fontSize: { xs: 36, md: 48 }, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {modelFile ? (
                    <>
                      <strong>{modelFile.name}</strong>
                      <br />({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                    </>
                  ) : currentLab && formData.modelPath ? (
                    <>
                      Current: {formData.modelPath.split("/").pop()}
                      <br />
                      Click to upload new file
                    </>
                  ) : (
                    <>
                      Click to upload or drag and drop
                      <br />
                      GLB files only (max 10 MB)
                    </>
                  )}
                </Typography>
                {uploadProgress.model && <LinearProgress sx={{ mt: 2 }} />}
              </Paper>
              {formErrors.modelPath && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 2 }}
                >
                  {formErrors.modelPath}
                </Typography>
              )}
            </Box>

            {/* Thumbnail Image Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Thumbnail Image *
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 2, md: 3 },
                  textAlign: "center",
                  borderStyle: "dashed",
                  borderColor: formErrors.thumbnailUrl
                    ? "error.main"
                    : "divider",
                  bgcolor: "background.default",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() =>
                  document.getElementById("thumbnail-file-input").click()
                }
              >
                <input
                  id="thumbnail-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  hidden
                  onChange={handleThumbnailFileChange}
                />
                <ImageIcon
                  sx={{ fontSize: { xs: 36, md: 48 }, color: "text.secondary", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {thumbnailFile ? (
                    <>
                      <strong>{thumbnailFile.name}</strong>
                      <br />({(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB)
                    </>
                  ) : currentLab && formData.thumbnailUrl ? (
                    <>
                      Current: {formData.thumbnailUrl.split("/").pop()}
                      <br />
                      Click to upload new image
                    </>
                  ) : (
                    <>
                      Click to upload or drag and drop
                      <br />
                      JPG, PNG, or WebP (max 5MB)
                    </>
                  )}
                </Typography>
                {uploadProgress.thumbnail && <LinearProgress sx={{ mt: 2 }} />}
              </Paper>
              {formErrors.thumbnailUrl && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 2 }}
                >
                  {formErrors.thumbnailUrl}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CloudUploadIcon /> : null}
          >
            {uploading ? "Uploading..." : currentLab ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Lab</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{labToDelete?.name}</strong>
            ? This action cannot be undone.
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

export default LabsAdmin;
