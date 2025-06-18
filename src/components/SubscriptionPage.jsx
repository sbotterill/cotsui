import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
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
import DiscordIcon from '@mui/icons-material/Message';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

// Initialize Stripe with error handling
const stripePromise = (() => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  console.log('Stripe key from env:', key); // Debug log
  if (!key) {
    console.error('Stripe publishable key is missing. Please check your .env file.');
    return null;
  }
  return loadStripe(key);
})();

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: '$4.99',
    interval: 'month',
    features: [
      'Full access to all features',
      'Discord support',
      'Real-time data updates',
      '7-day free trial',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Plan',
    price: '$49.99',
    interval: 'year',
    features: [
      'All Monthly features',
      'Priority Discord support',
      'Save 16% compared to monthly',
      '7-day free trial',
    ],
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [hasHadTrial, setHasHadTrial] = useState(false);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Check if user has already had a trial
    checkTrialStatus();
    
    // Check URL parameters for trial_used message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('trial_used') === 'true') {
      setHasHadTrial(true);
      setError('You have already used your free trial. Please choose a subscription plan to continue.');
    }
  }, [email, navigate]);

  const checkTrialStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok && data.has_had_trial) {
        setHasHadTrial(true);
      }
    } catch (err) {
      console.error('Error checking trial status:', err);
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentDialog(false);
    // Redirect to main app after successful subscription
    window.location.href = '/';
  };

  const handlePaymentError = (error) => {
    setError(error);
    setShowPaymentDialog(false);
  };

  const handleSkipTrial = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/create-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          name: localStorage.getItem('userName'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to main app after successful trial creation
        window.location.href = '/';
      } else {
        if (data.has_had_trial) {
          setHasHadTrial(true);
          setError(data.error || 'You have already used your free trial. Please choose a subscription plan to continue.');
        } else {
          setError(data.error || 'Failed to create trial subscription');
        }
      }
    } catch (err) {
      setError('An error occurred while creating trial subscription');
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {hasHadTrial ? 'Choose Your Plan' : 'Choose Your Plan'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {hasHadTrial 
              ? 'Select a subscription plan to continue accessing the app.'
              : 'Start with a 7-day free trial. Cancel anytime.'
            }
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} justifyContent="center" maxWidth="md" sx={{ mx: 'auto' }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Grid item xs={12} sm={6} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: selectedPlan === plan.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ mb: 2 }}>
                    {plan.price}
                    <Typography
                      component="span"
                      variant="subtitle1"
                      color="text.secondary"
                    >
                      /{plan.interval}
                    </Typography>
                  </Typography>
                  <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
                    {plan.features.map((feature, index) => (
                      <Box
                        component="li"
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1.5,
                          color: 'text.secondary',
                        }}
                      >
                        <CheckCircleIcon
                          sx={{ color: 'success.main', mr: 1, fontSize: '1.2rem' }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : 
                      hasHadTrial ? `Subscribe to ${plan.name}` : 'Start Free Trial'
                    }
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Skip for now option - only show for users who haven't had a trial */}
        {!hasHadTrial && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Want to try the app first?
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                // Create a free trial subscription without payment
                handleSkipTrial();
              }}
              disabled={loading}
            >
              Start 7-Day Free Trial (No Payment Required)
            </Button>
          </Box>
        )}

        {showPaymentDialog && (
          <>
            {/* Backdrop overlay */}
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1300,
              }}
              onClick={() => setShowPaymentDialog(false)}
            />
            
            <Dialog
              open={showPaymentDialog}
              onClose={() => setShowPaymentDialog(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  position: 'relative',
                  zIndex: 1301,
                }
              }}
              BackdropProps={{
                sx: { backgroundColor: 'transparent' }
              }}
            >
              <DialogTitle sx={{ 
                pb: 1, 
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" component="div">
                    Complete Your Subscription
                  </Typography>
                  <IconButton
                    onClick={() => setShowPaymentDialog(false)}
                    size="small"
                    sx={{ color: 'text.secondary' }}
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
                    {selectedPlan === 'monthly' ? '$4.99' : '$49.99'}
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
                      {hasHadTrial 
                        ? "Subscription: Your subscription will start immediately and you will be charged the full amount."
                        : "7-Day Free Trial: Your card will not be charged during the trial period. You can cancel anytime before the trial ends."
                      }
                    </Typography>
                  </Alert>
                </Box>

                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <StripePayment
                      plan={selectedPlan}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      hasHadTrial={hasHadTrial}
                    />
                  </Elements>
                ) : (
                  <Alert severity="error">
                    Unable to load payment system. Please try again later.
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </Container>
    </Box>
  );
} 