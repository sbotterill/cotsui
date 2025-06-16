import * as React from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  TextField,
  InputAdornment,
  Link,
  Alert,
  IconButton,
  Box,
  Paper,
  Typography,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Divider,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PayPalIcon from '@mui/icons-material/Payment';
import { API_BASE_URL } from '../config';

// Password validation functions
const hasMinLength = (password) => password.length >= 10;
const hasUpperCase = (password) => /[A-Z]/.test(password);
const hasNumber = (password) => /[0-9]/.test(password);
const hasSymbol = (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

const passwordRequirements = [
  { label: 'At least 10 characters', validator: hasMinLength },
  { label: 'At least one uppercase letter', validator: hasUpperCase },
  { label: 'At least one number', validator: hasNumber },
  { label: 'At least one special character', validator: hasSymbol },
];

export default function SignUpPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [selectedPlan, setSelectedPlan] = React.useState('monthly');
  const [paymentMethod, setPaymentMethod] = React.useState('credit');
  const [cardNumber, setCardNumber] = React.useState('');
  const [cardName, setCardName] = React.useState('');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.validator(password));
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isPasswordValid()) {
      setError('Password does not meet requirements');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (paymentMethod === 'credit' && (!cardNumber || !cardName || !expiryDate || !cvv)) {
      setError('Please fill in all credit card details');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          subscription_plan: selectedPlan === 'monthly' ? 'basic' : 'premium',
          renewal_date: new Date(Date.now() + (selectedPlan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_method: paymentMethod,
          payment_details: paymentMethod === 'credit' ? {
            card_number: cardNumber.replace(/\s/g, ''),
            card_name: cardName,
            expiry_date: expiryDate,
            cvv: cvv
          } : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/verify', { state: { email } });
      } else {
        setError(data.message || 'Failed to create account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container 
        component="main" 
        maxWidth="xs"
        sx={{
          height: '1000px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
          borderRadius: '10px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: 2,
            }}
          >
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              Sign Up
            </Typography>
            <Box component="form" onSubmit={handleSignUp} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="inherit" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="inherit" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle fontSize="inherit" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl margin="normal" fullWidth variant="outlined">
                <InputLabel size="small" htmlFor="password">
                  Password
                </InputLabel>
                <OutlinedInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Password"
                />
              </FormControl>
              
              {/* Password Requirements List */}
              <List dense sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', mt: 1 }}>
                {passwordRequirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {req.validator(password) ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="error" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={req.label}
                      primaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: req.validator(password) ? 'success.main' : 'error.main'
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="small"
              />

              <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
                <FormLabel component="legend">Choose Your Plan</FormLabel>
                <RadioGroup
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    '& .MuiFormControlLabel-root': {
                      flex: 1,
                      margin: 0,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      borderRadius: 1,
                      padding: 2,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '&.Mui-checked': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.primary.light + '20',
                      },
                    },
                  }}>
                    <FormControlLabel
                      value="monthly"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Monthly
                          </Typography>
                          <Typography variant="h6" color="primary">
                            $4.99
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            per month
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="annual"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Annual
                          </Typography>
                          <Typography variant="h6" color="primary">
                            $49.99
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            per year
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </RadioGroup>
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>7-Day Free Trial</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Start with a 7-day free trial. You will be automatically charged {selectedPlan === 'monthly' ? '$4.99/month' : '$49.99/year'} after the trial period unless you cancel your subscription.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
                    You can cancel anytime during the trial period to avoid being charged.
                  </Typography>
                </Box>
              </FormControl>

              <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
                <FormLabel component="legend">Payment Method</FormLabel>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    '& .MuiFormControlLabel-root': {
                      flex: 1,
                      margin: 0,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      borderRadius: 1,
                      padding: 2,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      '&.Mui-checked': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.primary.light + '20',
                      },
                    },
                  }}>
                    <FormControlLabel
                      value="credit"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditCardIcon />
                          <Typography>Credit Card</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="paypal"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PayPalIcon />
                          <Typography>PayPal</Typography>
                        </Box>
                      }
                    />
                  </Box>
                </RadioGroup>

                {paymentMethod === 'credit' && (
                  <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Card Number"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      inputProps={{ maxLength: 19 }}
                      size="small"
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Name on Card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      size="small"
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <TextField
                        required
                        fullWidth
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        placeholder="MM/YY"
                        inputProps={{ maxLength: 5 }}
                        size="small"
                      />
                      <TextField
                        required
                        fullWidth
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                        inputProps={{ maxLength: 3 }}
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                {paymentMethod === 'paypal' && (
                  <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      You will be redirected to PayPal to complete your payment after signing up.
                    </Typography>
                  </Box>
                )}
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading || !isPasswordValid() || !confirmPassword || 
                  (paymentMethod === 'credit' && (!cardNumber || !cardName || !expiryDate || !cvv))}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Box>
            </Box>
          </Paper>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
        </Box>
      </Container>
    </Box>
  );
}