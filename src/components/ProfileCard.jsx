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
import DiscordIcon from '@mui/icons-material/Telegram';
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { CircularProgress } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  borderRadius: 2,
  overflow: 'hidden',
  maxHeight: '90vh'
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

export default function ProfileCard({ open, onClose, anchorEl, buttonRef }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [showSettings, setShowSettings] = React.useState(false);
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
  const userName = localStorage.getItem('userName') || 'User Name';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription?email=${encodeURIComponent(userEmail)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
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
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/auto-renewal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          auto_renewal: event.target.checked,
          email: userEmail
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
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: userEmail,
          subscriptionId: subscriptionData?.stripe_subscription_id 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show appropriate message based on cancellation type
        if (result.immediate_cancellation) {
          alert('Your subscription has been cancelled immediately. You will not be charged.');
        } else {
          alert(`Your subscription has been cancelled. You will maintain access until ${result.access_until ? new Date(result.access_until).toLocaleDateString() : 'your renewal date'}.`);
        }
        
        // Refresh subscription data
        await fetchSubscriptionData();
        handleSettingsClose();
      } else {
        const errorData = await response.json();
        alert(`Error cancelling subscription: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Error cancelling subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <Card sx={{ 
          width: 300,
          p: 0,
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#444' : '#ddd'}`,
          marginRight: '10px'
        }}>
          {/* Header Section */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Profile
            </Typography>
          </Box>

          {/* User Info Section */}
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Logged in as:
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 2 }}>
              {userName}
            </Typography>
          </Box>

          <Divider />

          {/* Discord Section */}
          <Box sx={{ 
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(88, 101, 242, 0.05)' : 'rgba(88, 101, 242, 0.02)',
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Join our Discord:
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.open('https://discord.gg/cQczXyMf', '_blank')}
              sx={{
                mt: 1,
                backgroundColor: '#5865F2',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#4752C4',
                },
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                width: '100%'
              }}
            >
              Discord
            </Button>
          </Box>

          <Divider />

          {/* Theme Switch Section */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              p: 1,
              borderRadius: 1,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <Typography variant="body2" color="text.secondary">
                Dark Mode
              </Typography>
              <ThemeSwitch />
            </Box>
          </Box>

          <Divider />

          {/* Settings Section */}
          <CardActions sx={{ 
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Button
              variant="outlined"
              onClick={handleSettingsOpen}
              startIcon={<SettingsIcon />}
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                }
              }}
            >
              Settings
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('subscriptionData');
                window.location.href = '/';
              }}
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.error.main,
                  color: '#fff'
                }
              }}
            >
              Logout
            </Button>
          </CardActions>
        </Card>
      </ClickAwayListener>

      {/* Settings Modal */}
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
          <Box sx={{ 
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          }}>
            <Typography 
              id="subscription-settings-modal" 
              variant="h6" 
              component="h2" 
              sx={{ 
                color: theme.palette.text.primary,
                fontWeight: 500
              }}
            >
              Subscription Settings
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {subscriptionData ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }}
                  >
                    Current Plan: {subscriptionData.subscription_plan ? 
                      subscriptionData.subscription_plan.charAt(0).toUpperCase() + 
                      subscriptionData.subscription_plan.slice(1) : 'None'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: subscriptionData.is_subscription_active 
                        ? theme.palette.success.main 
                        : theme.palette.error.main,
                      fontWeight: 500
                    }}
                  >
                    Status: {subscriptionData.is_subscription_active ? 'Active' : 'Inactive'}
                  </Typography>
                  {subscriptionData.payment_status === 'cancelled_at_period_end' && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.warning.main,
                        mt: 1,
                        fontWeight: 500
                      }}
                    >
                      Cancelled - Access until renewal date
                    </Typography>
                  )}
                  {subscriptionData.renewal_date && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        mt: 1
                      }}
                    >
                      Renewal Date: {formatDate(subscriptionData.renewal_date)}
                    </Typography>
                  )}
                  {subscriptionData.cancellation_date && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        mt: 1
                      }}
                    >
                      Cancellation Date: {formatDate(subscriptionData.cancellation_date)}
                    </Typography>
                  )}
                  {subscriptionData.is_trial_active && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.info.main,
                        mt: 1,
                        fontWeight: 500
                      }}
                    >
                      Free Trial Active
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleCancelSubscription}
                  disabled={loading || !subscriptionData.is_subscription_active || subscriptionData.payment_status === 'cancelled_at_period_end'}
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
                  {subscriptionData.payment_status === 'cancelled_at_period_end' 
                    ? 'Already Cancelled' 
                    : subscriptionData.is_trial_active 
                      ? 'Cancel Trial' 
                      : 'Cancel Subscription'}
                </Button>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
    </Popper>
  );
}
