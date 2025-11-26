import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { API_BASE_URL } from '../config';

export default function VerificationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Get email from URL parameters
  const email = new URLSearchParams(location.search).get('email');

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        // Store user info in localStorage
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', `${data.first_name} ${data.last_name}`);
        
        // Navigate to subscription page
        navigate('/subscription');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
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

      if (data.success) {
        setCountdown(60); // Start 60-second countdown
      } else {
        setError(data.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('An error occurred while resending the code');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        px: { xs: 2, sm: 3 }
      }}>
        <Alert 
          severity="error"
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Invalid verification link. Please sign up again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Box
        component="main"
        sx={{
          width: '100%',
          maxWidth: { xs: '320px', sm: '420px' },
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          mr: { xs: 5, sm: 0 },
          boxSizing: 'border-box',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 3, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            borderRadius: { xs: 2, sm: 3 },
            border: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >
          {/* Email Icon */}
          <Box
            sx={{
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.main + '15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <MailOutlineIcon 
              sx={{ 
                fontSize: { xs: 32, sm: 40 },
                color: theme.palette.primary.main 
              }} 
            />
          </Box>

          <Typography 
            component="h1" 
            variant="h5" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Verify Your Email
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: { xs: 2.5, sm: 3 }, 
              textAlign: 'center',
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
              lineHeight: 1.6,
              px: { xs: 0, sm: 1 }
            }}
          >
            We've sent a verification code to <strong>{email}</strong>. Please enter it below to complete your registration.
          </Typography>

          <Box component="form" onSubmit={handleVerification} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Verification Code"
              name="verificationCode"
              autoComplete="off"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { 
                  fontSize: isMobile ? '1.5rem' : '1.25rem',
                  textAlign: 'center',
                  letterSpacing: '0.75rem',
                  fontWeight: 600,
                  paddingLeft: '0.5rem',
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  left: '50%',
                  transform: 'translate(-50%, 20px)',
                  transformOrigin: 'center',
                  '&.MuiInputLabel-shrink': {
                    left: 0,
                    transform: 'translate(14px, -9px) scale(0.75)',
                    transformOrigin: 'top left',
                  }
                },
                '& .MuiOutlinedInput-input': {
                  textAlign: 'center',
                  '&::placeholder': {
                    textAlign: 'center',
                    opacity: { xs: 0.6, sm: 0.6 },
                    letterSpacing: { xs: '0.75rem', sm: '0.75rem' },
                    paddingLeft: { xs: '0.5rem', sm: '0.5rem' },
                  }
                }
              }}
            />

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  borderRadius: 2,
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: { xs: 3, sm: 3 }, 
                mb: 2,
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: 2,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                }
              }}
              disabled={loading || !verificationCode}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Email'}
            </Button>

            <Button
              fullWidth
              variant="text"
              size={isMobile ? 'medium' : 'large'}
              onClick={handleResendCode}
              disabled={loading || countdown > 0}
              sx={{
                py: { xs: 1, sm: 1.25 },
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {countdown > 0
                ? `Resend code in ${countdown}s`
                : 'Resend verification code'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 