import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ThemeSwitch from './ThemeSwitch';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import Modal from '@mui/material/Modal';
import { API_BASE_URL } from '../config';
import DiscordIcon from '@mui/icons-material/Telegram';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { CircularProgress } from '@mui/material';
import SubscriptionManager from './SubscriptionManager';

// Desktop subscription modal style
const getModalStyle = (isMobile) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: isMobile ? '95vw' : 800,
  maxWidth: '100%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  borderRadius: 2,
  overflow: 'hidden',
  maxHeight: '90vh',
  overflowY: 'auto'
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export default function ProfileCard({ open, onClose, anchorEl, buttonRef }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showSettings, setShowSettings] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const userName = localStorage.getItem('userName') || 'User Name';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

  const handleSettingsOpen = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  // Card content (shared between Modal and Popper)
  const cardContent = (
    <Card sx={{
      width: isMobile ? '100%' : 300,
      p: 0,
      overflow: 'hidden',
      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
      border: isMobile ? 'none' : `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#ddd'}`,
      marginRight: isMobile ? 0 : '10px',
      borderRadius: isMobile ? 0 : 1,
    }}>
      {/* Header Section */}
      <Box sx={{
        p: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Profile
        </Typography>
        {isMobile && (
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* User Info Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Logged in as:
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {userName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userEmail}
        </Typography>
      </Box>

      <Divider />

      {/* Actions Section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            Theme
          </Typography>
          <ThemeSwitch />
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={handleSettingsOpen}
          sx={{ mb: 1 }}
        >
          Subscription Settings
        </Button>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<DiscordIcon />}
          href="https://discord.gg/mJGS4Xyna4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Discord
        </Button>
      </Box>

      <Divider />

      {/* Logout Section */}
      <CardActions sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
        >
          Sign Out
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <>
      {/* Mobile: Modal */}
      {isMobile ? (
        <Modal
          open={open}
          onClose={onClose}
          aria-labelledby="profile-modal-title"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 350,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 24,
          }}>
            {cardContent}
          </Box>
        </Modal>
      ) : (
        /* Desktop: Popper */
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          sx={{
            zIndex: 1300,
            '& .MuiPaper-root': {
              marginTop: '8px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#ddd'}`,
            }
          }}
        >
          <ClickAwayListener onClickAway={onClose}>
            {cardContent}
          </ClickAwayListener>
        </Popper>
      )}

      {/* Settings Modal */}
      <Modal
        open={showSettings}
        onClose={handleSettingsClose}
        aria-labelledby="settings-modal-title"
      >
        <Box sx={getModalStyle(isMobile)}>
          <SubscriptionManager email={userEmail} />
        </Box>
      </Modal>
    </>
  );
}

