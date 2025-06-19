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
        navigate('/signup');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (response.ok) {
        // Check if user has active subscription or free trial
        const hasActiveSubscription = data.subscription_status === 'active' || 
                                    data.subscription_status === 'trialing' ||
                                    data.trial_status === 'active';
        
        const isTrialActive = data.trial_status === 'active' && 
                            new Date(data.trial_end) > new Date();

        if (hasActiveSubscription || isTrialActive) {
          setHasAccess(true);
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
    } catch (err) {
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