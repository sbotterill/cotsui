import * as React from 'react';
import { IconButton, Box } from '@mui/material';
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
      <IconButton
        ref={buttonRef}
        onClick={handleClick}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <AccountCircleIcon />
      </IconButton>
      <ProfileCard
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorEl={anchorEl}
        buttonRef={buttonRef}
      />
    </Box>
  );
}
