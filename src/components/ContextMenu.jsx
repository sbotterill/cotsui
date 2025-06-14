// src/components/ContextMenu.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import { Checkbox, FormControlLabel } from '@mui/material';
import CustomSnackbar from './Snackbar';
import { API_BASE_URL } from '../config';

export default function BasicMenu({
  commodities,    // full list of sections
  selected = [],  // currently‐checked ones
  onFilterChange, // (newSelected: string[]) => void
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
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
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          preferences: {
            selected: checkedList  // Save directly in preferences.selected
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save preferences: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Server returned unsuccessful response');
      }

      setSnackbarOpen(true);
      handleClose();
    } catch (error) {
      // You might want to show an error message to the user here
    }
  };

  return (
    <div>
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{ marginRight: 2 }}
      >
        Filter
      </Button>
      <Menu
        id='filter-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: { 'aria-labelledby': 'basic-button' },
        }}
        sx={{
          marginTop: "10px",
          maxHeight: '400px',
          '& .MuiPaper-root': {
            maxHeight: '400px',
            overflowY: 'auto'
          }
        }}
      >
        {commodities.map(commodity => (
          <FormControlLabel
            key={commodity}
            sx={{ 
              pl: 1,
              pr: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
            control={
              <Checkbox
                checked={checkedList.includes(commodity)}
                onChange={() => handleToggle(commodity)}
                size="small"
              />
            }
            label={<span style={{ fontSize: "14px" }}>{commodity}</span>}
          />
        ))}
        <Button
          variant="outlined"
          sx={{ 
            alignSelf: 'center', 
            m: 1, 
            width: 250,
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'background.paper'
          }}
          onClick={handleSavePreferences}
        >
          Save Preferences
        </Button>
      </Menu>
      <CustomSnackbar
        open={snackbarOpen}
        message="Preferences saved successfully"
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={3000}
      />
    </div>
  );
}
