import * as React from 'react';
import { IconButton, Box, Tooltip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ProfileCard from './ProfileCard';

export default function Profile() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const buttonRef = React.useRef(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Profile" placement="right" arrow>
        <IconButton
          ref={buttonRef}
          onClick={handleClick}
          sx={{
            color: '#cbb26a',
            width: 40,
            height: 40,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <AccountCircleIcon />
        </IconButton>
      </Tooltip>
      <ProfileCard
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorEl={anchorEl}
        buttonRef={buttonRef}
      />
    </Box>
  );
}
