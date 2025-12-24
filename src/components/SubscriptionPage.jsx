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
    price: '$34.99',
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
    price: '$299.99',
    interval: 'year',
    features: [
      'All Monthly features',
      'Priority Discord support',
      'Save 29% compared to monthly',
      '7-day free trial',
    ],
  },
];

const SUBSCRIPTION_PLANS_NO_TRIAL = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: '$34.99',
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
    price: '$299.99',
    interval: 'year',
    features: [
      'All Monthly features',
      'Priority Discord support',
      'Save 29% compared to monthly',
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

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(203, 178, 106, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#cbb26a',
      },
    },
    '& .MuiInputBase-input': {
      padding: { xs: '14px', sm: '16px' },
      fontSize: { xs: '1rem', sm: '16px' },
      color: '#fff',
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.6)',
      '&.Mui-focused': {
        color: '#cbb26a',
      },
    },
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
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 1 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, color: '#fff' }}>
            Start Your Free Trial
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                color: '#fff',
              },
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
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: '#fff' }}
          >
            Get Started with a 7-Day Free Trial
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Start exploring all features immediately. No credit card required during the trial period.
          </Typography>
          
          <Box sx={{ 
            mb: { xs: 2, sm: 3 }, 
            p: 2, 
            borderRadius: 2, 
            backgroundColor: 'rgba(203, 178, 106, 0.1)',
            border: '1px solid rgba(203, 178, 106, 0.3)',
          }}>
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: '#cbb26a' }}>
              You'll only need to add payment information when your trial ends. Cancel anytime during the trial.
            </Typography>
          </Box>

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
                sx={inputStyles}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={trialDetails.lastName}
                onChange={handleInputChange}
                required
                sx={inputStyles}
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
            background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
            color: '#000',
            '&:hover': {
              background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
              boxShadow: '0 8px 24px rgba(203, 178, 106, 0.3)',
            },
            '&:disabled': {
              background: 'rgba(203, 178, 106, 0.3)',
              color: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#000' }} />
          ) : (
            'Start Free Trial'
          )}
        </Button>

        <Box sx={{ mt: { xs: 2, sm: 3 }, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: 'rgba(255, 255, 255, 0.5)' }}
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

  const handlePlanSelect = async (planId) => {
    setSelectedPlan(planId);
    if (hasHadTrial) {
      // If they've had a trial, show payment dialog immediately
      setShowPaymentDialog(true);
    } else {
      // If they haven't had a trial, start trial directly using stored name
      await startTrialDirectly();
    }
  };

  const startTrialDirectly = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get name from localStorage (stored during signup)
      const storedName = localStorage.getItem('userName') || '';
      
      if (!storedName.trim()) {
        // Fallback: show trial dialog if name not found
        setShowTrialDialog(true);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/create-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: storedName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      setAuthorization(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#cbb26a' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        py: 4,
        overflowY: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ my: 'auto' }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
            Choose Your Plan
          </Typography>
          {hasHadTrial ? (
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }} gutterBottom>
              Welcome back! Choose a plan to continue your access.
            </Typography>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }} gutterBottom>
                Start with a 7-day free trial. No credit card required during trial.
              </Typography>
            </>
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
          {plans.map((plan, idx) => (
            <Box key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  background: idx === 1 
                    ? 'linear-gradient(135deg, rgba(203, 178, 106, 0.1) 0%, rgba(203, 178, 106, 0.02) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 1 
                    ? '2px solid rgba(203, 178, 106, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(203, 178, 106, 0.5)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" component="div" sx={{ mb: 1, color: '#fff' }}>
                    {plan.price}
                    <Typography
                      component="span"
                      variant="subtitle1"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
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
                        }}
                      >
                        <CheckCircleIcon
                          sx={{ 
                            color: '#cbb26a', 
                            mr: 1, 
                            fontSize: '1.2rem' 
                          }}
                        />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      background: idx === 1 
                        ? 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)'
                        : 'transparent',
                      border: idx === 1 ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                      color: idx === 1 ? '#000' : '#fff',
                      '&:hover': {
                        background: idx === 1 
                          ? 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)'
                          : 'rgba(203, 178, 106, 0.1)',
                        borderColor: idx === 1 ? 'transparent' : '#cbb26a',
                        boxShadow: idx === 1 ? '0 8px 24px rgba(203, 178, 106, 0.3)' : 'none',
                      },
                      '&:disabled': {
                        background: 'rgba(203, 178, 106, 0.3)',
                        color: 'rgba(0, 0, 0, 0.5)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: idx === 1 ? '#000' : '#cbb26a' }} /> : 
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
                    You will be charged {selectedPlan === 'monthly' ? '$34.99/month' : '$299.99/year'} immediately. Cancel anytime.
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