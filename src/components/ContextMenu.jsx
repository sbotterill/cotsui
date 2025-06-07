// src/components/ContextMenu.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import { Checkbox, FormControlLabel } from '@mui/material';

export default function BasicMenu({
  commodities,    // full list of sections
  selected = [],  // currently‐checked ones
  onFilterChange, // (newSelected: string[]) => void
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // local copy of “what’s checked”
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
          onClick={handleClose}
        >
          Save Preferences
        </Button>
      </Menu>
    </div>
  );
}
