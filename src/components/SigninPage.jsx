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
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function SigninPage({ setAuthorization }) {
  const theme = useTheme();
  const navigate = useNavigate();
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
            const prefsData = await prefsResponse.json();
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 1,
            }}
          >
            COTS UI
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: theme.palette.text.secondary,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            Access real-time CFTC Commitment of Traders data
          </Typography>
        </Box>

        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom 
            align="center"
            sx={{ 
              fontWeight: 600,
              mb: 3,
            }}
          >
            Welcome Back
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
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
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="primary" />
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
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
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
              sx={{ 
                mt: 4, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 3,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Link 
                component={RouterLink} 
                to="/signup" 
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
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
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
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
