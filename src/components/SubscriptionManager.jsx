import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import StripePayment from './StripePayment';

const SUBSCRIPTION_PLANS = [
  { value: 'free', label: 'Free', price: 0 },
  { value: 'basic', label: 'Basic', price: 9.99 },
  { value: 'premium', label: 'Premium', price: 19.99 }
];

const SubscriptionManager = ({ email }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    subscription_plan: 'free',
    renewal_date: null,
    cancellation_date: null
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, [email]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptionData(data);
        setFormData({
          subscription_plan: data.subscription_plan || 'free',
          renewal_date: data.renewal_date ? new Date(data.renewal_date) : null,
          cancellation_date: data.cancellation_date ? new Date(data.cancellation_date) : null
        });
      } else {
        setError(data.error || 'Failed to fetch subscription data');
      }
    } catch (err) {
      setError('An error occurred while fetching subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          ...formData,
          renewal_date: formData.renewal_date ? format(formData.renewal_date, 'yyyy-MM-dd') : null,
          cancellation_date: formData.cancellation_date ? format(formData.cancellation_date, 'yyyy-MM-dd') : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Subscription updated successfully');
        fetchSubscriptionData();
      } else {
        setError(data.error || 'Failed to update subscription');
      }
    } catch (err) {
      setError('An error occurred while updating subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (plan) => {
    if (plan === 'free') {
      setFormData({ ...formData, subscription_plan: plan });
    } else {
      setSelectedPlan(plan);
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentDialog(false);
    setSuccess('Payment successful! Your subscription has been updated.');
    setFormData({ ...formData, subscription_plan: selectedPlan });
    await fetchSubscriptionData();
  };

  const handlePaymentError = (error) => {
    setError(error);
    setShowPaymentDialog(false);
  };

  if (loading && !subscriptionData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Subscription Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Available Plans
        </Typography>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Button
            key={plan.value}
            variant={formData.subscription_plan === plan.value ? "contained" : "outlined"}
            onClick={() => handlePlanChange(plan.value)}
            sx={{ mr: 2, mb: 2 }}
          >
            {plan.label} - ${plan.price}/month
          </Button>
        ))}
      </Box>

      {subscriptionData && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Current Status
          </Typography>
          <Typography>
            Plan: {subscriptionData.subscription_plan}
          </Typography>
          <Typography>
            Status: {subscriptionData.is_subscription_active ? 'Active' : 'Inactive'}
          </Typography>
          {subscriptionData.renewal_date && (
            <Typography>
              Renewal Date: {new Date(subscriptionData.renewal_date).toLocaleDateString()}
            </Typography>
          )}
          {subscriptionData.cancellation_date && (
            <Typography>
              Cancellation Date: {new Date(subscriptionData.cancellation_date).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}

      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Subscribe to {SUBSCRIPTION_PLANS.find(p => p.value === selectedPlan)?.label}
        </DialogTitle>
        <DialogContent>
          <StripePayment
            plan={selectedPlan}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default SubscriptionManager; 