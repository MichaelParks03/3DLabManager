import React from 'react';
import {
  Card,
  CardContent,
  Skeleton,
  Box,
  Grid
} from '@mui/material';

/**
 * LoadingSkeleton Component
 * Shows loading placeholders while data is being fetched
 * Matches the ItemCard layout for smooth transitions
 */
function ItemCardSkeleton() {
  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Image skeleton */}
      <Skeleton
        variant="rectangular"
        height={160}
        animation="wave"
        sx={{ backgroundColor: 'grey.100' }}
      />

      <CardContent sx={{ p: 2 }}>
        {/* Header with ID and Status */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}
        >
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 10 }} />
        </Box>

        {/* Item name */}
        <Skeleton variant="text" width="85%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />

        {/* Category */}
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 12, mb: 1 }} />

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width="70%" height={16} />
        </Box>
        <Skeleton variant="text" width="50%" height={16} sx={{ ml: 2.5 }} />

        {/* View details section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * LoadingSkeleton Component
 * Renders multiple skeleton cards in a grid layout
 */
function LoadingSkeleton({ count = 6 }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <ItemCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

export default LoadingSkeleton;