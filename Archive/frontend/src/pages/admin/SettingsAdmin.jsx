import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SettingsAdmin = () => {
  const theme = useTheme();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure application settings (read-only placeholders)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Theme Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Theme Settings
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Current Theme
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Primary"
                      sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                    />
                    <Chip
                      label="Secondary"
                      sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText }}
                    />
                    <Chip
                      label="Background"
                      sx={{ bgcolor: theme.palette.background.default, border: '1px solid', borderColor: 'divider' }}
                    />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Primary Color: <strong>{theme.palette.primary.main}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Secondary Color: <strong>{theme.palette.secondary.main}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Font Family: <strong>{theme.typography.fontFamily.split(',')[0]}</strong>
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Notifications
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch disabled defaultChecked />}
                  label="Email notifications"
                />
                <FormControlLabel
                  control={<Switch disabled defaultChecked />}
                  label="Issue alerts"
                />
                <FormControlLabel
                  control={<Switch disabled />}
                  label="Weekly reports"
                />
                <FormControlLabel
                  control={<Switch disabled defaultChecked />}
                  label="Item status changes"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Integrations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="API Endpoint"
                    fullWidth
                    disabled
                    value="https://api.3dlabmanager.com"
                    helperText="Backend API endpoint"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Webhook URL"
                    fullWidth
                    disabled
                    placeholder="https://..."
                    helperText="Webhook for external notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="SMTP Server"
                    fullWidth
                    disabled
                    placeholder="smtp.example.com"
                    helperText="Email server configuration"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select defaultValue="daily" label="Backup Frequency">
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    v1.0.0
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Environment
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Development
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date().toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsAdmin;
