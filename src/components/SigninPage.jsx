import React, { useState } from 'react';
import {
  Button,
  FormControl,
  TextField,
  InputAdornment,
  Link,
  Alert,
  IconButton,
  Box,
  Paper,
  Container,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function SigninPage({ setAuthorization }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const { email, password } = formData;

      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (data.message?.includes('verify your email')) {
            navigate(`/verify?email=${encodeURIComponent(email)}`);
            return;
          }
          setError(data.message || 'Invalid credentials');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }

      if (data.authorized) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', `${data.first_name} ${data.last_name}`);
        
        try {
          // Load preferences and favorites
          const [prefsResponse, favoritesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/preferences?email=${encodeURIComponent(email)}`, {
              credentials: 'include'
            }),
            fetch(`${API_BASE_URL}/preferences/favorites?email=${encodeURIComponent(email)}`, {
              credentials: 'include'
            })
          ]);

          if (prefsResponse.ok) {
            await prefsResponse.json();
          }

          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            if (favoritesData.favorites?.selected) {
              localStorage.setItem('favorites', JSON.stringify(favoritesData.favorites.selected));
            }
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }

        // Set authorization state before navigation
        setAuthorization(true);
        
        // Dispatch storage event manually since we're in the same window
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'userEmail',
          newValue: email
        }));
        
        // Check if user needs to be redirected to subscription page
        if (!data.subscription_active) {
          // Check if user has already had a trial using the subscription status endpoint
          try {
            const statusResponse = await fetch(`${API_BASE_URL}/subscription-status?email=${encodeURIComponent(email)}`);
            const statusData = await statusResponse.json();
            
            if (statusResponse.ok && statusData.has_had_trial) {
              // User has already had a trial
              navigate('/subscription?trial_used=true');
            } else {
              // User hasn't had a trial yet
              navigate('/subscription');
            }
          } catch (err) {
            console.error('Error checking trial status:', err);
            // Default to subscription page without trial_used param
            navigate('/subscription');
          }
          return;
        }
        
        // If subscription is active, go to dashboard
        navigate('/dashboard');
        return;
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check if the server is running.');
      } else {
        setError('An error occurred while checking credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        px: { xs: 2, sm: 3 },
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      {/* Back arrow */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: '#cbb26a',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Container maxWidth="sm" sx={{ my: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: { xs: 2, sm: 4 },
          }}
        >
          <Box
            component="img"
            src="/noBgColor.png"
            alt="COTS UI Logo"
            sx={{
              height: { xs: '40px', sm: '50px' },
              width: 'auto',
              mb: 2,
            }}
          />
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              maxWidth: '90%',
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            Access real-time CFTC Commitment of Traders data
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2.5, sm: 3, md: 4 }, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom 
            align="center"
            sx={{ 
              fontWeight: 600,
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: '#fff',
            }}
          >
            Welcome Back
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: { xs: 2, sm: 3 },
                borderRadius: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                mb: { xs: 1.5, sm: 2 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(203, 178, 106, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#cbb26a',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  '&.Mui-focused': {
                    color: '#cbb26a',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle sx={{ color: '#cbb26a' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal" variant="outlined">
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(203, 178, 106, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#cbb26a',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '1rem', sm: '1rem' },
                    color: '#fff',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&.Mui-focused': {
                      color: '#cbb26a',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: { xs: 3, sm: 4 }, 
                mb: 2,
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: 2,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
                color: '#000',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
                  boxShadow: '0 8px 24px rgba(203, 178, 106, 0.3)',
                },
                '&:disabled': {
                  background: 'rgba(203, 178, 106, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                mt: { xs: 2, sm: 3 },
                gap: { xs: 1, sm: 1 },
                alignItems: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <Link 
                component={RouterLink} 
                to="/signup" 
                variant="body2"
                sx={{
                  color: '#cbb26a',
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  textAlign: { xs: 'center', sm: 'left' },
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Don't have an account? Sign Up
              </Link>
              <Link 
                component={RouterLink} 
                to="/forgot-password" 
                variant="body2"
                sx={{
                  color: '#cbb26a',
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  textAlign: { xs: 'center', sm: 'right' },
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
