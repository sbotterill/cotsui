import * as React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { API_BASE_URL } from '../config';

export default function VerificationPage() {
  const theme = useTheme();
  const [verificationCode, setVerificationCode] = React.useState('');
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resendDisabled, setResendDisabled] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Get email from URL parameters
  const email = new URLSearchParams(window.location.search).get('email');

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user information and redirect to main app
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', `${data.first_name} ${data.last_name}`);
        window.location.href = '/';
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendDisabled(true);
    setCountdown(60); // 60 seconds cooldown
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to resend verification code');
      }
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    }
  };

  if (!email) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Alert severity="error">Invalid verification link. Please sign up again.</Alert>
      </Box>
    );
  }

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
      <Container component="main" maxWidth="xs">
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
            Verify Your Email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            We've sent a verification code to {email}. Please enter it below to complete your registration.
          </Typography>

          <Box component="form" onSubmit={handleVerification} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Verification Code"
              name="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              size="small"
              inputProps={{ maxLength: 6 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !verificationCode}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify Email'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleResendCode}
              disabled={resendDisabled}
              sx={{ mt: 1 }}
            >
              {resendDisabled
                ? `Resend code in ${countdown}s`
                : 'Resend verification code'}
            </Button>
          </Box>
        </Paper>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
} 