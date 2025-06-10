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

    // update both local and parent
    setCheckedList(sorted);
    onFilterChange(sorted);
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
            table_filters: checkedList
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setSnackbarOpen(true);
      handleClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
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
      >
        {commodities.map(commodity => (
          <FormControlLabel
            key={commodity}
            sx={{ pl: 1 }}
            control={
              <Checkbox
                checked={checkedList.includes(commodity)}
                onChange={() => handleToggle(commodity)}
              />
            }
            label={commodity}
          />
        ))}
        <Button
          variant="outlined"
          sx={{ alignSelf: 'center', m: 1, width: 250 }}
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
