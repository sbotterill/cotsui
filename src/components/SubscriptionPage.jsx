import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
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
  TextField,
  Grid,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../config';
import StripePayment from './StripePayment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

// Initialize Stripe with error handling
const stripePromise = (() => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
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

const SUBSCRIPTION_PLANS_NO_TRIAL = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: '$4.99',
    interval: 'month',
    features: [
      'Full access to all features',
      'Discord support',
      'Real-time data updates',
      'Immediate access',
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
      'Immediate access',
    ],
  },
];

// New component for starting trial without payment
function StartTrialDialog({ open, onClose, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trialDetails, setTrialDetails] = useState({
    firstName: '',
    lastName: ''
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTrialDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartTrial = async () => {
    if (!trialDetails.firstName.trim() || !trialDetails.lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }

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
          name: `${trialDetails.firstName} ${trialDetails.lastName}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 2, sm: 4 },
          maxWidth: { xs: 'calc(100% - 32px)', sm: '600px' },
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 1 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Start Your Free Trial
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Get Started with a 7-Day Free Trial
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Start exploring all features immediately. No credit card required during the trial period.
          </Typography>
          
          <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              You'll only need to add payment information when your trial ends. Cancel anytime during the trial.
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 } }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={trialDetails.firstName}
                onChange={handleInputChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: { xs: '14px', sm: '16px' },
                    fontSize: { xs: '1rem', sm: '16px' }
                  },
                  '& .MuiOutlinedInput-root': {
                    height: { xs: '52px', sm: '56px' },
                    borderRadius: 2,
                  }
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={trialDetails.lastName}
                onChange={handleInputChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: { xs: '14px', sm: '16px' },
                    fontSize: { xs: '1rem', sm: '16px' }
                  },
                  '& .MuiOutlinedInput-root': {
                    height: { xs: '52px', sm: '56px' },
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={handleStartTrial}
          disabled={loading}
          size="large"
          sx={{ 
            py: { xs: 1.25, sm: 1.5 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
            }
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Start Free Trial'
          )}
        </Button>

        <Box sx={{ mt: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            By starting your trial, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionPage({ setAuthorization }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [trialEligibility, setTrialEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }

    // Check if user has already had a trial
    checkTrialEligibility();
  }, [email, navigate]);

  const checkTrialEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setTrialEligibility({
          hasHadTrial: data.has_had_trial || false,
          subscriptionStatus: data.subscription_status
        });
      } else {
        // If we can't check eligibility, assume they can have a trial
        setTrialEligibility({
          hasHadTrial: false,
          subscriptionStatus: 'inactive'
        });
      }
    } catch (err) {
      console.error('Error checking trial eligibility:', err);
      // Default to allowing trial if we can't check
      setTrialEligibility({
        hasHadTrial: false,
        subscriptionStatus: 'inactive'
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    if (hasHadTrial) {
      // If they've had a trial, show payment dialog immediately
      setShowPaymentDialog(true);
    } else {
      // If they haven't had a trial, show trial dialog
      setShowTrialDialog(true);
    }
  };

  const handleTrialSuccess = async (result) => {
    setShowTrialDialog(false);
    setAuthorization(true);
    navigate('/dashboard');
  };

  const handleTrialError = (error) => {
    setError(error);
    setShowTrialDialog(false);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentDialog(false);
    setAuthorization(true);
    navigate('/dashboard');
  };

  const handlePaymentError = (error) => {
    setError(error);
    setShowPaymentDialog(false);
  };

  // Check if user came from URL with trial_used parameter
  const trialUsedFromURL = searchParams.get('trial_used') === 'true';
  const hasHadTrial = trialEligibility?.hasHadTrial || trialUsedFromURL;
  const plans = hasHadTrial ? SUBSCRIPTION_PLANS_NO_TRIAL : SUBSCRIPTION_PLANS;

  if (checkingEligibility) {
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
            Choose Your Plan
          </Typography>
          {hasHadTrial ? (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Welcome back! Choose a plan to continue your access.
            </Typography>
          ) : (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Start with a 7-day free trial. No credit card required during trial.
            </Typography>
          )}
        </Box>

        {hasHadTrial && (
          <Alert severity="info" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            You have already used your free trial. Please choose a subscription plan to continue.
          </Alert>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            maxWidth: 800,
            mx: 'auto',
          }}
        >
          {plans.map((plan) => (
            <Box key={plan.id}>
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
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                    {plan.price}
                    <Typography
                      component="span"
                      variant="subtitle1"
                      color="text.secondary"
                    >
                      /{plan.interval}
                    </Typography>
                  </Typography>
                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
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
                          sx={{ 
                            color: 'success.main', 
                            mr: 1, 
                            fontSize: '1.2rem' 
                          }}
                        />
                        <Typography variant="body2">
                          {feature}
                        </Typography>
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
                    color="primary"
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
                    {loading ? <CircularProgress size={24} /> : 
                      hasHadTrial 
                        ? `Start ${plan.interval === 'month' ? 'Monthly' : 'Annual'} Plan`
                        : `Start ${plan.interval === 'month' ? 'Monthly' : 'Annual'} Trial`
                    }
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Trial Dialog */}
        <StartTrialDialog
          open={showTrialDialog}
          onClose={() => setShowTrialDialog(false)}
          onSuccess={handleTrialSuccess}
          onError={handleTrialError}
        />

        {/* Payment Dialog for users who have had trials */}
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
                  Complete Your Subscription
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
                    You will be charged {selectedPlan === 'monthly' ? '$4.99/month' : '$49.99/year'} immediately. Cancel anytime.
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