import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';

/**
 * ItemCard Component
 * Displays individual item information in a card layout
 * Used in the Items page grid/list view
 */
function ItemCard({ item }) {
  // Get status color for the chip
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'checked_out':
        return 'warning';
      case 'broken':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format status text for display
  const formatStatus = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <Card
      component={Link}
      to={`/item/${item.id}`}
      sx={{
        height: 440, // Increased height to show Amazon button completely
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease-in-out',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
          textDecoration: 'none'
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px'
        }
      }}
    >
      {/* Item Image */}
      <Box
        sx={{
          height: 120, // Reduced for better proportions with 6 cards
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <CardMedia
          component="img"
          height="120"
          image={item.thumbnailUrl}
          alt={`${item.name} thumbnail`}
          sx={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onError={(e) => {
            // Hide the broken image and show placeholder instead
            e.target.style.display = 'none';
          }}
        />
        {/* Fallback placeholder */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            p: 2,
            textAlign: 'center'
          }}
        >
          <InventoryIcon sx={{ fontSize: '2rem', mb: 1, opacity: 0.6 }} />
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            {item.category}
          </Typography>
        </Box>
      </Box>

      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          p: 1.75,
          height: 320, // Increased to accommodate Amazon button
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Header with ID and Status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1,
            height: 28, // Fixed height
            flexShrink: 0
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}
          >
            {item.id}
          </Typography>

          <Chip
            label={formatStatus(item.status)}
            color={getStatusColor(item.status)}
            size="small"
            sx={{
              fontSize: '0.6875rem',
              height: 20,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>

        {/* Item Name */}
        <Box sx={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              height: '2.4em' // Fixed height for consistency
            }}
          >
            {item.name}
          </Typography>
        </Box>

        {/* Category */}
        <Box sx={{ height: 28, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Chip
            label={item.category}
            variant="outlined"
            size="small"
            sx={{
              fontSize: '0.6875rem',
              height: 24
            }}
          />
        </Box>

        {/* Location */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
            height: 40, // Reduced height for location section
            flexShrink: 0,
            mt: 0.5
          }}
        >
          <LocationIcon
            sx={{
              fontSize: '1rem',
              color: 'text.secondary',
              mt: 0.1,
              flexShrink: 0
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              height: '2.4em' // Fixed height for location
            }}
          >
            {item.locationPath}
          </Typography>
        </Box>

        {/* Equipment Details (Asset Tag, Brand, Model, Serial) */}
        {(item.assetTag || item.brand || item.model || item.serialNumber) && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
              mt: 0.5,
              pt: 0.75,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexShrink: 0
            }}
          >
            {item.assetTag && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                Asset: {item.assetTag}
              </Typography>
            )}
            {item.brand && item.model && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                {item.brand} {item.model}
              </Typography>
            )}
            {item.serialNumber && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                S/N: {item.serialNumber}
              </Typography>
            )}
          </Box>
        )}

        {/* Amazon Link Button (if available) */}
        {item.amazonLink && (
          <Box
            sx={{
              pt: 0.5,
              flexShrink: 0
            }}
          >
            <Box
              component="a"
              href={item.amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Prevent card click
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                py: 0.75,
                px: 1.5,
                backgroundColor: '#FF9900',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#EC7211',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: '0.875rem' }} />
              View on Amazon
            </Box>
          </Box>
        )}

        {/* View Details Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 0.1,
            borderTop: '0.5px solid',
            borderColor: 'divider',
            height: 20, // Fixed height for button area
            flexShrink: 0,
            mt: item.amazonLink ? 0.5 : 'auto' // Adjust margin based on Amazon link presence
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            View Details
          </Typography>

          <IconButton
            size="small"
            sx={{
              color: 'primary.main',
              p: 0.5
            }}
            tabIndex={-1} // Prevent double tab since the whole card is clickable
          >
            <OpenInNewIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ItemCard;