import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

const SUBSCRIPTION_PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' }
];

const SubscriptionManager = ({ email }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
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

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Subscription Plan"
            value={formData.subscription_plan}
            onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
            sx={{ mb: 2 }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => (
              <MenuItem key={plan.value} value={plan.value}>
                {plan.label}
              </MenuItem>
            ))}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mb: 2 }}>
              <DatePicker
                label="Renewal Date"
                value={formData.renewal_date}
                onChange={(newValue) => setFormData({ ...formData, renewal_date: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <DatePicker
                label="Cancellation Date"
                value={formData.cancellation_date}
                onChange={(newValue) => setFormData({ ...formData, cancellation_date: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? 'Updating...' : 'Update Subscription'}
        </Button>
      </form>

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
    </Paper>
  );
};

export default SubscriptionManager; 