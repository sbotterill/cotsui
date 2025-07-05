import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { API_BASE_URL } from '../config';

export default function SubscriptionGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.log('No userEmail found in localStorage');
        navigate('/signup');
        return;
      }

      console.log('Checking subscription status for:', userEmail);
      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      console.log('Subscription status response:', data);

      if (response.ok) {
        // Check if user has active subscription or valid trial
        const hasActiveSubscription = data.subscription_status === 'active' || data.subscription_status === 'trialing';
        const hasValidTrial = data.trial_status === 'active' && 
                            new Date(data.trial_end) > new Date();
        
        console.log('Subscription check:', {
          hasActiveSubscription,
          hasValidTrial,
          subscriptionStatus: data.subscription_status,
          trialStatus: data.trial_status,
          trialEnd: data.trial_end
        });

        // Also check payment_status as a fallback
        const hasActivePayment = data.payment_status === 'active' || data.payment_status === 'trialing';

        if (hasActiveSubscription || hasValidTrial || hasActivePayment) {
          console.log('User has valid access');
          setHasAccess(true);
        } else {
          console.log('No valid subscription found');
          // Check if user has already had a trial
          if (data.has_had_trial) {
            console.log('User has already used trial');
            // Redirect to subscription page with message that trial has been used
            navigate('/subscription?trial_used=true');
          } else {
            console.log('First time user, redirecting to subscription');
            // Redirect to subscription page for first-time users
            navigate('/subscription');
          }
        }
      } else {
        console.log('Error response from subscription check:', data);
        // If user not found or other error, redirect to subscription page
        navigate('/subscription');
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return hasAccess ? children : null;
} 