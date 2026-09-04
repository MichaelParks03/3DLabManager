import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

/**
 * SearchBar Component
 * Provides search functionality with Enter key or button click
 * Includes clear button and proper accessibility
 */
function SearchBar({
  value,
  onChange,
  onClear,
  onSearch,
  placeholder = "Search items by name, category, or location...",
  disabled = false
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      disabled={disabled}
      variant="outlined"
      size="medium"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              sx={{
                color: disabled ? 'text.disabled' : 'text.secondary',
                fontSize: '1.25rem'
              }}
            />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {value && (
                <IconButton
                  onClick={onClear}
                  size="small"
                  aria-label="Clear search"
                  disabled={disabled}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ClearIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
              <IconButton
                onClick={onSearch}
                size="small"
                aria-label="Search"
                disabled={disabled || !value}
                sx={{
                  color: 'primary.main',
                  bgcolor: 'primary.lighter',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                <SearchIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Box>
          </InputAdornment>
        )
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'background.paper',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: 2,
          }
        },
        '& .MuiInputBase-input': {
          fontSize: '1rem',
          '&::placeholder': {
            color: 'text.secondary',
            opacity: 0.8
          }
        }
      }}
      inputProps={{
        'aria-label': 'Search items',
        autoComplete: 'off'
      }}
    />
  );
}

export default SearchBar;