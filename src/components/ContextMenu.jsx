// src/components/ContextMenu.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import { Checkbox, FormControlLabel, useTheme, Box } from '@mui/material';
import CustomSnackbar from './Snackbar';
import { API_BASE_URL } from '../config';
import FilterListIcon from '@mui/icons-material/FilterList';

export default function BasicMenu({
  commodities,    // full list of sections
  selected = [],  // currently‐checked ones
  onFilterChange, // (newSelected: string[]) => void
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState('success');
  const open = Boolean(anchorEl);

  // local copy of "what's checked"
  const [checkedList, setCheckedList] = React.useState(selected);

  // if parent ever resets `selected`, copy it in
  React.useEffect(() => {
    setCheckedList(selected);
  }, [selected]);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // toggle one commodity on/off
  const handleToggle = (commodity) => {
    // build the new list
    const next = checkedList.includes(commodity)
      ? checkedList.filter(c => c !== commodity)
      : [...checkedList, commodity];

    // sort alphabetically
    const sorted = [...next].sort((a, b) => a.localeCompare(b));

    // update both local and parent state, but don't save to server
    setCheckedList(sorted);
    onFilterChange(sorted, false);
  };

  const handleSavePreferences = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        setSnackbarOpen(true);
        setSnackbarMessage('Error: User email not found. Please try logging in again.');
        setSnackbarSeverity('error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/preferences/table_filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          table_filters: {
            selected: checkedList
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save preferences: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Server returned unsuccessful response');
      }

      setSnackbarMessage('Preferences saved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClose();
    } catch (error) {
      setSnackbarMessage(`Error saving preferences: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <div>
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        startIcon={<FilterListIcon />}
        sx={{
          color: 'inherit',
          textTransform: 'none',
          minWidth: 'auto',
          px: 1,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        Filter
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
          overflowY: 'auto', 
          flex: 1,
          borderBottom: 1,
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
        }}>
          {commodities.map(commodity => (
            <FormControlLabel
              key={commodity}
              sx={{ 
                pl: 1,
                pr: 2.5,
                width: '100%',
                margin: 0,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)'
                }
              }}
              control={
                <Checkbox
                  checked={checkedList.includes(commodity)}
                  onChange={() => handleToggle(commodity)}
                  size="small"
                />
              }
              label={<span style={{ fontSize: "14px", wordBreak: "normal", whiteSpace: "normal" }}>{commodity}</span>}
            />
          ))}
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
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.04)',
              }
            }}
            onClick={handleSavePreferences}
          >
            Save Preferences
          </Button>
        </Box>
      </Menu>
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={3000}
      />
    </div>
  );
}
