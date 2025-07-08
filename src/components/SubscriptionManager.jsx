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
  DialogActions,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePayment from './StripePayment';
import HistoryIcon from '@mui/icons-material/History';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { API_BASE_URL } from '../config';

// Initialize Stripe
const stripePromise = (() => {
  const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return null;
  }
  return loadStripe(key);
})();

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
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    subscription_plan: 'free',
    renewal_date: null,
    cancellation_date: null
  });
  const [updatingAutoRenewal, setUpdatingAutoRenewal] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, [email]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/subscription?email=${encodeURIComponent(email)}`);
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

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/payment-history?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setPaymentHistory(data.payments);
      } else {
        setError(data.error || 'Failed to fetch payment history');
      }
    } catch (err) {
      setError('An error occurred while fetching payment history');
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

  const handleViewHistory = () => {
    fetchPaymentHistory();
    setShowHistoryDialog(true);
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

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          subscriptionId: subscriptionData.id
        }),
      });

      if (response.ok) {
        setSuccess('Subscription cancelled successfully');
        await fetchSubscriptionData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while cancelling subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRenewalToggle = async () => {
    if (!subscriptionData) return;

    const newAutoRenewValue = subscriptionData.cancel_at_period_end;
    
    if (!window.confirm(
      !newAutoRenewValue
        ? 'Are you sure you want to disable auto-renewal? Your subscription will end on the next billing date.'
        : 'Are you sure you want to enable auto-renewal? Your subscription will automatically renew at the end of each billing period.'
    )) {
      return;
    }

    try {
      setUpdatingAutoRenewal(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/subscription/auto-renewal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          auto_renew: newAutoRenewValue
        }),
      });

      if (response.ok) {
        await fetchSubscriptionData();
        setSuccess(!newAutoRenewValue 
          ? 'Auto-renewal has been disabled. Your subscription will end on the next billing date.'
          : 'Auto-renewal has been enabled'
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update auto-renewal settings');
      }
    } catch (err) {
      setError('An error occurred while updating auto-renewal settings');
    } finally {
      setUpdatingAutoRenewal(false);
    }
  };

  if (loading && !subscriptionData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Subscription Management
        </Typography>
        <IconButton onClick={handleViewHistory} color="primary" title="View Payment History">
          <HistoryIcon />
        </IconButton>
      </Box>

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

      {subscriptionData && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Subscription
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box flex={1}>
                  <Typography variant="body1" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" color={subscriptionData.status === 'active' ? 'success.main' : 'error.main'}>
                    {subscriptionData.status === 'active' ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="body1" color="text.secondary">
                    Plan
                  </Typography>
                  <Typography variant="body1">
                    {subscriptionData.plan?.nickname || 'Cots UI'} (${(subscriptionData.plan?.amount / 100).toFixed(2)}/month)
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="body1" color="text.secondary">
                    Next Renewal
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(subscriptionData.current_period_end)}
                  </Typography>
                </Box>
              </Box>
              
              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!subscriptionData.cancel_at_period_end}
                      onChange={handleAutoRenewalToggle}
                      disabled={updatingAutoRenewal || subscriptionData.status !== 'active'}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Auto-renewal
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {subscriptionData.cancel_at_period_end
                          ? `Subscription will end on ${formatDate(subscriptionData.current_period_end)}`
                          : 'Subscription will automatically renew'
                        }
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {updatingAutoRenewal && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CreditCardIcon color="primary" />
                <Typography variant="h6">
                  Payment Method
                </Typography>
              </Box>
              {subscriptionData?.default_payment_method?.card ? (
                <Box>
                  <Typography variant="body1">
                    {subscriptionData.default_payment_method.card.brand.toUpperCase()} •••• {subscriptionData.default_payment_method.card.last4}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expires {subscriptionData.default_payment_method.card.exp_month}/{subscriptionData.default_payment_method.card.exp_year}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No payment method on file
                </Typography>
              )}
              <Box mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPaymentDialog(true)}
                  startIcon={<CreditCardIcon />}
                >
                  {subscriptionData?.default_payment_method ? 'Update Payment Method' : 'Add Payment Method'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {(subscriptionData.status === 'active' || subscriptionData.status === 'trialing') && !subscriptionData.cancel_at_period_end && (
            <Box mt={3}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelSubscription}
                fullWidth
              >
                Cancel Subscription
              </Button>
            </Box>
          )}
        </>
      )}

      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Payment Method
        </DialogTitle>
        <DialogContent>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripePayment
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isUpdatingPaymentMethod={true}
              />
            </Elements>
          ) : (
            <Alert severity="error">
              Unable to load payment system. Please try again later.
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment History</DialogTitle>
        <DialogContent>
          <List>
            {paymentHistory.map((payment, index) => (
              <React.Fragment key={payment.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          ${(payment.amount / 100).toFixed(2)} - {payment.status}
                        </Typography>
                        {/* PDF download button temporarily hidden
                        {payment.invoice_pdf && (
                          <Tooltip title="Download Invoice PDF">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => window.open(payment.invoice_pdf, '_blank')}
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        */}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(payment.created * 1000).toLocaleString()}
                        </Typography>
                        {payment.payment_method_details?.card && (
                          <Typography variant="body2" color="text.secondary">
                            {payment.payment_method_details.card.brand.toUpperCase()} •••• {payment.payment_method_details.card.last4}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                {index < paymentHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SubscriptionManager; 