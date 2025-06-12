import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

export default function CustomSnackbar({ 
  open, 
  message, 
  onClose, 
  actionText = "UNDO",
  onAction,
  autoHideDuration = 6000 
}) {
  const theme = useTheme();
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
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
          minWidth: '300px',
          fontSize: '14px',
          padding: '8px 16px',
        },
        '& .MuiSnackbarContent-message': {
          padding: '8px 0',
        },
        '& .MuiSnackbarContent-action': {
          paddingLeft: '16px',
        }
      }}
    />
  );
}
