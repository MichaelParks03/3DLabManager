import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  SearchOff as SearchOffIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * EmptyState Component
 * Shows appropriate messages when no data is available
 * Includes different states for empty search results vs no data
 */
function EmptyState({
  type = 'empty',
  title,
  description,
  onRetry,
  onClear,
  icon: CustomIcon
}) {
  // Default configurations for different empty states
  const configs = {
    empty: {
      icon: SearchOffIcon,
      title: 'No items match your search',
      description: 'Try clearing filters or searching a different term.',
      primaryAction: onClear ? 'Clear filters' : null,
      primaryHandler: onClear
    },
    error: {
      icon: RefreshIcon,
      title: 'Unable to load items',
      description: 'There was a problem loading the inventory. Please try again.',
      primaryAction: 'Try again',
      primaryHandler: onRetry
    },
    noData: {
      icon: SearchOffIcon,
      title: 'No items found',
      description: 'The lab inventory appears to be empty.',
      primaryAction: null,
      primaryHandler: null
    }
  };

  const config = configs[type] || configs.empty;
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderStyle: 'dashed'
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 6,
            px: 2
          }}
        >
          {/* Icon */}
          <Icon
            sx={{
              fontSize: 64,
              color: 'text.secondary',
              opacity: 0.6,
              mb: 2
            }}
          />

          {/* Title */}
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              mb: 1
            }}
          >
            {displayTitle}
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 400,
              lineHeight: 1.6,
              mb: 3
            }}
          >
            {displayDescription}
          </Typography>

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            {config.primaryAction && config.primaryHandler && (
              <Button
                variant="contained"
                onClick={config.primaryHandler}
                sx={{
                  minWidth: 120,
                  fontWeight: 500
                }}
              >
                {config.primaryAction}
              </Button>
            )}

            {type === 'error' && onClear && (
              <Button
                variant="outlined"
                onClick={onClear}
                sx={{
                  minWidth: 120,
                  fontWeight: 500
                }}
              >
                Clear filters
              </Button>
            )}
          </Box>

          {/* Additional help text for search */}
          {type === 'empty' && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 2,
                fontSize: '0.875rem'
              }}
            >
              Search by item name, category, or location path
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default EmptyState;