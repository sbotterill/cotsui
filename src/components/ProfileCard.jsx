import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ThemeSwitch from './ThemeSwitch';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import Switch from '@mui/material/Switch';
import { API_BASE_URL } from '../config';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export default function ProfileCard({ open, onClose, showSettings, setShowSettings }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const userEmail = localStorage.getItem('userEmail');
  const [subscriptionData, setSubscriptionData] = React.useState(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem('subscriptionData');
    return stored ? JSON.parse(stored) : null;
  });
  const [autoRenewal, setAutoRenewal] = React.useState(() => {
    const stored = localStorage.getItem('subscriptionData');
    return stored ? JSON.parse(stored).auto_renewal || false : false;
  });
  const [loading, setLoading] = React.useState(false);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (response.ok) {
        setSubscriptionData(data);
        setAutoRenewal(data.auto_renewal || false);
        // Store in localStorage
        localStorage.setItem('subscriptionData', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  React.useEffect(() => {
    if (showSettings && !subscriptionData) {
      fetchSubscriptionData();
    }
  }, [showSettings]);

  const handleSettingsOpen = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleAutoRenewalToggle = async (event) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          auto_renewal: event.target.checked,
        }),
      });

      if (response.ok) {
        const updatedData = { ...subscriptionData, auto_renewal: event.target.checked };
        setSubscriptionData(updatedData);
        setAutoRenewal(event.target.checked);
        localStorage.setItem('subscriptionData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          cancellation_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const updatedData = {
          ...subscriptionData,
          is_subscription_active: false,
          cancellation_date: new Date().toISOString().split('T')[0]
        };
        setSubscriptionData(updatedData);
        localStorage.setItem('subscriptionData', JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Box 
        sx={{ 
          position: 'absolute',
          top: '60px',
          right: '0',
          zIndex: 1000,
          minWidth: 275,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Card variant="outlined">
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Logged in as:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {userEmail}
            </Typography>
          </Box>
          <Divider />
          <CardActions sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end', 
            p: 2,
            '& .MuiFormGroup-root': {
              alignItems: 'flex-end'
            }
          }}>
            <Box sx={{ 
              width: '100%', 
              mb: 2, 
              display: 'flex', 
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Typography>
              <ThemeSwitch />
            </Box>
            <Box sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <IconButton 
                onClick={handleSettingsOpen}
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  }
                }}
              >
                <SettingsIcon />
              </IconButton>
              <Button 
                size="small" 
                onClick={() => {
                  localStorage.removeItem('userEmail');
                  localStorage.removeItem('userName');
                  localStorage.removeItem('subscriptionData');
                  window.location.href = '/';
                }}
              >
                Sign Out
              </Button>
            </Box>
          </CardActions>
        </Card>
      </Box>

      <Modal
        open={showSettings}
        onClose={handleSettingsClose}
        aria-labelledby="subscription-settings-modal"
      >
        <Box sx={{
          ...style,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}>
          <Typography 
            id="subscription-settings-modal" 
            variant="h6" 
            component="h2" 
            gutterBottom
            sx={{ color: theme.palette.text.primary }}
          >
            Subscription Settings
          </Typography>
          
          {subscriptionData && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom
                  sx={{ color: theme.palette.text.primary }}
                >
                  Current Plan: {subscriptionData.subscription_plan}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    color: subscriptionData.is_subscription_active 
                      ? theme.palette.success.main 
                      : theme.palette.error.main 
                  }}
                >
                  Status: {subscriptionData.is_subscription_active ? 'Active' : 'Inactive'}
                </Typography>
                {subscriptionData.renewal_date && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Renewal Date: {formatDate(subscriptionData.renewal_date)}
                  </Typography>
                )}
                {subscriptionData.cancellation_date && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Cancellation Date: {formatDate(subscriptionData.cancellation_date)}
                  </Typography>
                )}
              </Box>

              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: 1,
              }}>
                <Typography sx={{ color: theme.palette.text.primary }}>
                  Auto-Renewal
                </Typography>
                <Switch
                  checked={autoRenewal}
                  onChange={handleAutoRenewalToggle}
                  disabled={loading}
                  color="primary"
                />
              </Box>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleCancelSubscription}
                disabled={loading || !subscriptionData.is_subscription_active}
                sx={{
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(211, 47, 47, 0.08)' 
                      : 'rgba(211, 47, 47, 0.04)',
                  },
                  '&.Mui-disabled': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(0, 0, 0, 0.12)',
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(0, 0, 0, 0.26)',
                  },
                }}
              >
                Cancel Subscription
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}
