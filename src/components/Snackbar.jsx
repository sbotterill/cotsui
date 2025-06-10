import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function CustomSnackbar({ 
  open, 
  message, 
  onClose, 
  actionText = "UNDO",
  onAction,
  autoHideDuration = 6000 
}) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  const action = (
    <React.Fragment>
      {onAction && (
        <Button color="secondary" size="small" onClick={onAction}>
          {actionText}
        </Button>
      )}
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      message={message}
      action={action}
    />
  );
}
