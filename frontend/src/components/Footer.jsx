import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';


function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 3,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        {/* Main footer content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2
          }}
        >
          {/* University information */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              3D Lab Manager - Senior Design Engineering Lab
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              University of Texas at Arlington
            </Typography>
          </Box>

          {/* Footer links */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1, md: 3 },
              alignItems: { xs: 'flex-start', md: 'center' }
            }}
          >
            <Link
              href="https://www.uta.edu/legal"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                  borderRadius: 1
                }
              }}
            >
              Legal & Privacy Notice
            </Link>
            <Link
              href="https://www.uta.edu/accessibility"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                  borderRadius: 1
                }
              }}
            >
              Accessibility
            </Link>
            <Link
              href="https://www.uta.edu/sitepolicies"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'text.secondary',
                fontSize: '0.875rem',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                  borderRadius: 1
                }
              }}
            >
              Site Policies
            </Link>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Copyright and last updated */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            © {currentYear}{' '}
            <Link
              href="https://www.uta.edu"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              The University of Texas at Arlington
            </Link>
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            Last updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
        </Box>

        {/* Contact information */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.5
            }}
          >
            For technical support or questions about lab equipment,{' '}
            <Link
              href="mailto:labsupport@uta.edu"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              contact lab support
            </Link>{' '}
            or call (817) 272-LABS.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;