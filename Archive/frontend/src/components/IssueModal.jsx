import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ReportProblem as ReportProblemIcon
} from '@mui/icons-material';

import { submitIssue } from '../lib/supabaseIssues';
import { ISSUE_TYPES } from '../shared/types';

/**
 * IssueModal Component
 * Accessible modal for reporting equipment issues
 * Includes form validation and proper focus management
 */
function IssueModal({
  open,
  onClose,
  onSuccess,
  itemId,
  itemName
}) {
  const [formData, setFormData] = useState({
    type: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({ type: '', notes: '' });
      setErrors({});
      setSubmitError(null);
      setSubmitting(false);
    }
  }, [open]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Please select an issue type';
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Please provide additional details';
    } else if (formData.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const issueData = {
        itemId,
        type: formData.type,
        notes: formData.notes.trim()
      };

      await submitIssue(issueData);

      // Success - close modal and notify parent
      onClose();
      onSuccess?.({
        message: 'Issue submitted successfully. A TA will review it shortly.',
        type: 'success'
      });

    } catch (error) {
      console.error('Failed to submit issue:', error);
      setSubmitError(error.message || 'Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close with escape key
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="issue-modal-title"
      aria-describedby="issue-modal-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        id="issue-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: 1
        }}
      >
        <ReportProblemIcon sx={{ color: 'warning.main' }} />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          Report Issue
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close dialog"
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 2 }}>
        <Typography
          id="issue-modal-description"
          variant="body1"
          sx={{ mb: 3, color: 'text.secondary' }}
        >
          Report an issue with <strong>{itemName}</strong> (ID: {itemId}).
          A TA will review and address the problem.
        </Typography>

        {/* Error Alert */}
        {submitError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Issue Type */}
          <FormControl
            fullWidth
            error={!!errors.type}
            disabled={submitting}
            sx={{ mb: 3 }}
          >
            <InputLabel id="issue-type-label">Issue Type *</InputLabel>
            <Select
              labelId="issue-type-label"
              value={formData.type}
              onChange={handleChange('type')}
              label="Issue Type *"
              aria-describedby={errors.type ? "issue-type-error" : undefined}
            >
              {ISSUE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {errors.type && (
              <Typography
                id="issue-type-error"
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {errors.type}
              </Typography>
            )}
          </FormControl>

          {/* Notes */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Details"
            placeholder="Describe the issue in detail... (e.g., error messages, symptoms, when it started)"
            value={formData.notes}
            onChange={handleChange('notes')}
            error={!!errors.notes}
            helperText={errors.notes || `${formData.notes.length}/500 characters`}
            disabled={submitting}
            required
            inputProps={{
              maxLength: 500,
              'aria-describedby': 'notes-helper-text'
            }}
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <ReportProblemIcon />}
          sx={{ minWidth: 120 }}
        >
          {submitting ? 'Submitting...' : 'Submit Issue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IssueModal;