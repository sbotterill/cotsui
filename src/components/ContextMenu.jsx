// src/components/ContextMenu.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
import CustomSnackbar from './Snackbar';
import { API_BASE_URL } from '../config';
import { EXCHANGE_CODE_MAP } from '../constants';
import { ListItemIcon } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { Divider } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function BasicMenu({
  commodities,    // full list of sections
  selected = [],  // currently‐checked ones
  onFilterChange, // (newSelected: string[]) => void
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [checkedList, setCheckedList] = React.useState(selected);
  const [showSnackbar, setShowSnackbar] = React.useState(false);
  const open = Boolean(anchorEl);

  // Normalize exchange code by trimming and ensuring consistent format
  const normalizeCode = (code) => {
    if (!code) return '';
    return code.trim();
  };

  // Format exchange code to include full name
  const formatExchange = (code) => {
    if (!code) return '';
    const cleanCode = normalizeCode(code);
    const fullName = EXCHANGE_CODE_MAP[cleanCode] || cleanCode;
    return `${cleanCode} - ${fullName}`;
  };

  // Convert raw code to formatted string
  const getFormattedExchange = (code) => {
    const cleanCode = normalizeCode(code);
    return formatExchange(cleanCode);
  };

  // Convert formatted string back to raw code
  const getRawCode = (formatted) => {
    if (!formatted) return '';
    const cleanCode = formatted.split(' - ')[0];
    return normalizeCode(cleanCode);
  };

  // Update local state when parent state changes
  React.useEffect(() => {
    const normalizedSelected = selected.map(code => normalizeCode(code));
    setCheckedList(normalizedSelected);  // Store raw codes in state
  }, [selected]);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (formattedExchange) => {
    const rawCode = getRawCode(formattedExchange);
    const normalizedSelected = selected.map(code => normalizeCode(code));
    const isCurrentlySelected = normalizedSelected.includes(rawCode);

    // Create new list based on selection
    const newSelected = isCurrentlySelected
      ? normalizedSelected.filter(code => code !== rawCode)
      : [...normalizedSelected, rawCode];

    // Sort the new list by full names
    const sorted = [...newSelected].sort((a, b) => {
      const aFormatted = getFormattedExchange(a);
      const bFormatted = getFormattedExchange(b);
      const aName = aFormatted.split(' - ')[1] || aFormatted;
      const bName = bFormatted.split(' - ')[1] || bFormatted;
      return aName.localeCompare(bName);
    });

    // Pass false to prevent saving to server - only UI state update
    onFilterChange(sorted, false);
  };

  const handleSelectAll = () => {    
    // Normalize all codes before passing them
    const normalizedCommodities = commodities.map(code => normalizeCode(code));
    // Pass false to prevent saving to server - only UI state update
    onFilterChange(normalizedCommodities, false);
  };

  const handleClearAll = () => {
    // Pass false to prevent saving to server - only UI state update
    onFilterChange([], false);
  };

  const handleSavePreferences = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      console.log('ContextMenu - Saving preferences, checkedList:', checkedList);
      
      const requestBody = {
        email: email,
        table_filters: {
          selected: checkedList
        }
      };
      console.log('ContextMenu - Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/preferences/table_filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('ContextMenu - Save response:', responseData);

      setShowSnackbar(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Format and sort commodities list for display
  const formattedCommodities = React.useMemo(() => {
    return selected.map(code => getFormattedExchange(normalizeCode(code))).sort((a, b) => {
      const aName = a.split(' - ')[1];
      const bName = b.split(' - ')[1];
      return aName.localeCompare(bName);
    });
  }, [selected]);

  // Render menu items
  const renderItems = () => {
    return commodities.map((code) => {
      const cleanCode = normalizeCode(code);
      const name = EXCHANGE_CODE_MAP[cleanCode] || cleanCode;
      const formattedExchange = `${cleanCode} - ${name}`;
      const normalizedSelected = selected.map(s => normalizeCode(s));
      const isChecked = normalizedSelected.includes(cleanCode);

      return (
        <Box
          key={formattedExchange}
          sx={{
            borderBottom: 1,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <FormControlLabel
            sx={{
              pl: 1,
              pr: 2.5,
              py: 0.75,
              width: '100%',
              margin: 0,
              '& .MuiFormControlLabel-label': {
                width: '100%'
              }
            }}
            control={
              <Checkbox 
                checked={isChecked}
                onChange={() => handleToggle(formattedExchange)}
                size="small"
                sx={{
                  py: 0.5,
                  mr: 1
                }}
              />
            }
            label={
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                ml: 0.5
              }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.875rem',
                    lineHeight: 1.2
                  }}
                >
                  {cleanCode}
                </Typography>
                {name && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: '0.75rem',
                      mt: 0.25,
                      lineHeight: 1.2
                    }}
                  >
                    {name}
                  </Typography>
                )}
              </Box>
            }
          />
        </Box>
      );
    });
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<FilterListIcon />}
        sx={{
          color: theme.palette.text.primary,
          textTransform: 'none',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        Filter Exchanges
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          sx: {
            maxHeight: '60vh',
            width: 360,
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          gap: 1, 
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
        }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleSelectAll}
            sx={{
              flex: 1,
              borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Select All
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleClearAll}
            sx={{
              flex: 1,
              borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Clear All
          </Button>
        </Box>
        <Box sx={{ 
          overflowY: 'auto', 
          flex: 1,
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
        }}>
          {renderItems()}
        </Box>
        <Box sx={{ 
          p: 1, 
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
          borderTop: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
        }}>
          <Button
            variant="outlined"
            fullWidth
            sx={{ 
              borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
            onClick={handleSavePreferences}
          >
            Save Preferences
          </Button>
        </Box>
      </Menu>
      <CustomSnackbar
        open={showSnackbar}
        onClose={() => setShowSnackbar(false)}
        message="Preferences saved successfully"
        severity="success"
      />
    </div>
  );
}
