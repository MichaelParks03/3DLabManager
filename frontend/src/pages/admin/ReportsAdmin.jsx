import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

const ReportsAdmin = () => {
  const [dateRange, setDateRange] = useState('30');
  const [itemsByStatus, setItemsByStatus] = useState([]);
  const [issuesByLab, setIssuesByLab] = useState([]);
  const [_loading, _setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchReports = async () => {
    _setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?days=${dateRange}`);
      const data = await response.json();
      if (data.success) {
        setItemsByStatus(data.data.itemsByStatus);
        setIssuesByLab(data.data.issuesByLab);
      }
    } catch (_error) {
      showSnackbar('Failed to load reports', 'error');
    } finally {
      _setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleExportCSV = (dataType) => {
    let csvContent = '';
    let filename = '';

    if (dataType === 'items') {
      csvContent = 'Status,Count\n';
      itemsByStatus.forEach((item) => {
        csvContent += `${item.status},${item.count}\n`;
      });
      filename = 'items-by-status.csv';
    } else if (dataType === 'issues') {
      csvContent = 'Lab,Count\n';
      issuesByLab.forEach((item) => {
        csvContent += `${item.lab},${item.count}\n`;
      });
      filename = 'issues-by-lab.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSnackbar(`Exported ${filename}`, 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View insights and export data
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            label="Date Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Items by Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Items by Status
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportCSV('items')}
                  aria-label="Export items by status as CSV"
                >
                  Export CSV
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={itemsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {itemsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Issues by Lab */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Issues by Lab
                </Typography>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportCSV('issues')}
                  aria-label="Export issues by lab as CSV"
                >
                  Export CSV
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={issuesByLab}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lab" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#1e3a8a" name="Issues" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {itemsByStatus.reduce((sum, item) => sum + item.count, 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Total Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {issuesByLab.reduce((sum, item) => sum + item.count, 0)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Total Issues (Last {dateRange} Days)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {issuesByLab.length}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Active Labs
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsAdmin;
