import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function SubscriptionPage({ setAuthorization }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
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
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Start with a 7-day free trial. Cancel anytime.
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap',
            maxWidth: '1200px',
            mx: 'auto',
            px: 2
          }}
        >
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Box
              key={plan.id}
              sx={{
                flex: '1 1 400px',
                maxWidth: '500px',
                minWidth: '350px'
              }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: selectedPlan === plan.id ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      textAlign: 'center'
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      mb: 2,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'center'
                    }}
                  >
                    {plan.price}
                    <Typography
                      component="span"
                      variant="subtitle1"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      /{plan.interval}
                    </Typography>
                  </Typography>
                  <Box 
                    component="ul" 
                    sx={{ 
                      pl: 0, 
                      listStyle: 'none',
                      mt: 2
                    }}
                  >
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
                      `Start ${plan.interval === 'month' ? 'Monthly' : 'Annual'} Plan`
                    }
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>

        {showPaymentDialog && (
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
                    Your first 7 days are free. After the trial, you'll be charged {selectedPlan === 'monthly' ? '$4.99/month' : '$49.99/year'}. Cancel anytime during the trial.
                  </Typography>
                </Alert>
              </Box>

              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripePayment
                    plan={selectedPlan}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
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