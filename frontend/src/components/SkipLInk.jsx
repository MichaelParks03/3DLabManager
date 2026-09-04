import React from 'react';
import Link from '@mui/material/Link';

/**
 * Accessibility Skip Link Component
 * Allows keyboard users to skip directly to main content
 * Following WCAG 2.1 guidelines and university accessibility standards
 */
function SkipLink() {
  const handleSkip = (event) => {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      // Scroll to main content for visual confirmation
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Link
      href="#main-content"
      onClick={handleSkip}
      className="skip-link"
      sx={{
        position: 'absolute',
        top: '-2.5rem',
        left: '1rem',
        zIndex: 9999,
        backgroundColor: 'primary.main',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: 1,
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'top 0.2s ease-in-out',
        '&:focus': {
          top: '1rem',
        },
      }}
    >
      Skip to main content
    </Link>
  );
}

export default SkipLink;