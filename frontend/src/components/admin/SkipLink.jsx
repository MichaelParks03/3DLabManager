import React from 'react';
import { Link } from '@mui/material';

/**
 * Skip to main content link for accessibility
 */
const SkipLink = () => {
  return (
    <Link
      href="#content"
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 10000,
        padding: '1rem',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
        '&:focus': {
          left: '1rem',
          top: '1rem',
        },
      }}
    >
      Skip to main content
    </Link>
  );
};

export default SkipLink;
