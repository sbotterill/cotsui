import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert,
  TextField,
  Divider
} from '@mui/material';
import { API_BASE_URL } from '../config';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export default function StripePayment({ plan, onSuccess, onError, hasHadTrial = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription
      const response = await fetch(`${API_BASE_URL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          name: localStorage.getItem('userName'),
          priceId: plan === 'monthly' ? process.env.REACT_APP_STRIPE_MONTHLY_PRICE : process.env.REACT_APP_STRIPE_ANNUAL_PRICE
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Handle successful subscription creation
      if (data.requiresAction && data.clientSecret) {
        // Handle 3D Secure authentication if required
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
        if (confirmError) {
          throw new Error(confirmError.message);
        }
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
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          Payment Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your card details to start your free trial
        </Typography>
        
        <Box
          sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            backgroundColor: '#fafafa',
            '&:focus-within': {
              borderColor: 'primary.main',
              backgroundColor: '#fff',
            },
          }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Order Summary
        </Typography>
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 2,
          border: '1px solid #e9ecef'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {plan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {plan === 'monthly' ? '$4.99' : '$49.99'}
            </Typography>
          </Box>
          {!hasHadTrial && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">
                  Free Trial (7 days)
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  -$4.99
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600}>
              {hasHadTrial ? 'Total Charge' : "Today's Charge"}
            </Typography>
            <Typography variant="body2" fontWeight={600} color={hasHadTrial ? "text.primary" : "success.main"}>
              {hasHadTrial ? (plan === 'monthly' ? '$4.99' : '$49.99') : '$0.00'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || loading}
        size="large"
        sx={{ 
          py: 1.5,
          fontSize: '1.1rem',
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
          hasHadTrial 
            ? `Subscribe to ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan`
            : `Start ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan Trial`
        )}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ 
        display: 'block', 
        textAlign: 'center', 
        mt: 2,
        lineHeight: 1.4
      }}>
        By clicking the button above, you agree to our Terms of Service and Privacy Policy. 
        Your subscription will automatically renew unless cancelled before the trial ends.
      </Typography>
    </Box>
  );
} 