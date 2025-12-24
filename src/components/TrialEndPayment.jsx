import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../config';
import StripePayment from './StripePayment';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

// Initialize Stripe with error handling
const stripePromise = (() => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return null;
  }
  return loadStripe(key);
})();

export default function TrialEndPayment({ onSuccess, onError }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Check subscription status to see if trial has ended
    checkSubscriptionStatus();
  }, [email, navigate]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        const now = new Date();
        const trialEndDate = data.trial_end ? new Date(data.trial_end * 1000) : null;
        
        if (trialEndDate && now > trialEndDate && data.subscription_status === 'trialing') {
          // Trial has ended, show payment options
          setSubscriptionInfo(data);
        } else {
          // Trial is still active or subscription is active
          onSuccess(data);
        }
      } else {
        setError('Unable to check subscription status');
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
      setError('Error checking subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentDialog(false);
    onSuccess(result);
  };

  const handlePaymentError = (error) => {
    setError(error);
    setShowPaymentDialog(false);
  };

  const handleCancelTrial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          subscriptionId: subscriptionInfo?.subscription_id
        }),
      });

      if (response.ok) {
        // Redirect to subscription page
        navigate('/subscription?trial_used=true');
      } else {
        setError('Failed to cancel trial');
      }
    } catch (err) {
      setError('Error canceling trial');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <Container maxWidth="sm">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            fullWidth
          >
            Try Again
          </Button>
        </Container>
      </Box>
    );
  }

  if (!subscriptionInfo) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Your Trial Has Ended
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Continue enjoying all features by choosing a subscription plan.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2">
            Your 7-day free trial has ended. To continue accessing all features, please choose a subscription plan below.
          </Typography>
        </Alert>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            maxWidth: 800,
            mx: 'auto',
            mb: 4,
          }}
        >
          {/* Monthly Plan */}
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Monthly Plan
              </Typography>
              <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                $34.99
                <Typography
                  component="span"
                  variant="subtitle1"
                  color="text.secondary"
                >
                  /month
                </Typography>
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Full access to all features</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Discord support</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Real-time data updates</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Cancel anytime</Typography>
                </Box>
              </Box>
            </CardContent>
            <CardContent sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handlePlanSelect('monthly')}
                disabled={loading}
                size="large"
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                Choose Monthly Plan
              </Button>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Annual Plan
              </Typography>
              <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                $299.99
                <Typography
                  component="span"
                  variant="subtitle1"
                  color="text.secondary"
                >
                  /year
                </Typography>
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">All Monthly features</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Priority Discord support</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Save 29% compared to monthly</Typography>
                </Box>
                <Box component="li" sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: 'text.secondary' }}>
                  <Typography variant="body2">Cancel anytime</Typography>
                </Box>
              </Box>
            </CardContent>
            <CardContent sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handlePlanSelect('annual')}
                disabled={loading}
                size="large"
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                Choose Annual Plan
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleCancelTrial}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Cancel Subscription
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You can cancel your subscription at any time from your account settings.
          </Typography>
        </Box>

        {/* Payment Dialog */}
        {showPaymentDialog && (
          <Dialog
            open={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ m: 0, p: 3, pb: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Add Payment Method
                </Typography>
                <IconButton
                  aria-label="close"
                  onClick={() => setShowPaymentDialog(false)}
                  sx={{
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedPlan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                </Typography>
                <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                  {selectedPlan === 'monthly' ? '$34.99' : '$299.99'}
                  <Typography
                    component="span"
                    variant="subtitle1"
                    color="text.secondary"
                  >
                    /{selectedPlan === 'monthly' ? 'month' : 'year'}
                  </Typography>
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Add your payment method to continue your subscription. You'll be charged {selectedPlan === 'monthly' ? '$34.99/month' : '$299.99/year'}.
                  </Typography>
                </Alert>
              </Box>

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripePayment
                    plan={selectedPlan}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    hasHadTrial={true}
                    isUpdatingPaymentMethod={false}
                    isAddingToTrial={true}
                  />
                </Elements>
              ) : (
                <Alert severity="error">
                  Unable to load payment system. Please try again later.
                </Alert>
              )}
            </DialogContent>
          </Dialog>
        )}
      </Container>
    </Box>
  );
} 