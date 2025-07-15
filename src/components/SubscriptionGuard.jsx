import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { API_BASE_URL } from '../config';
import TrialEndPayment from './TrialEndPayment';

export default function SubscriptionGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);
  const [showTrialEndPayment, setShowTrialEndPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        navigate('/signup');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (response.ok) {
        const now = new Date();
        const trialEndDate = data.trial_end ? new Date(data.trial_end * 1000) : null; // Convert Unix timestamp to Date

        // Check various conditions for access
        const hasActiveSubscription = data.subscription_status === 'active';
        const isInTrialPeriod = trialEndDate && now < trialEndDate;
        const hasActivePayment = data.payment_status === 'active';
        const isTrialEnded = trialEndDate && now > trialEndDate && data.subscription_status === 'trialing';

        if (hasActiveSubscription || isInTrialPeriod || hasActivePayment) {
          setHasAccess(true);
        } else if (isTrialEnded) {
          // Trial has ended, show payment options
          setShowTrialEndPayment(true);
        } else {
          // Check if user has already had a trial
          if (data.has_had_trial) {
            // Redirect to subscription page with message that trial has been used
            navigate('/subscription?trial_used=true');
          } else {
            // Redirect to subscription page for first-time users
            navigate('/subscription');
          }
        }
      } else {
        // If user not found or other error, redirect to subscription page
        navigate('/subscription');
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setError('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleTrialEndSuccess = (result) => {
    setShowTrialEndPayment(false);
    setHasAccess(true);
  };

  const handleTrialEndError = (error) => {
    setError(error);
    setShowTrialEndPayment(false);
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
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (showTrialEndPayment) {
    return (
      <TrialEndPayment
        onSuccess={handleTrialEndSuccess}
        onError={handleTrialEndError}
      />
    );
  }

  if (hasAccess) {
    return children;
  }

  return null;
} 