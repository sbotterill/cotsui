import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE_URL } from '../config';

// Password validation functions
const hasMinLength = (password) => password.length >= 10;
const hasUpperCase = (password) => /[A-Z]/.test(password);
const hasLowerCase = (password) => /[a-z]/.test(password);
const hasNumber = (password) => /[0-9]/.test(password);
const hasSpecialChar = (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password);

const passwordRequirements = [
  { label: 'At least 10 characters', validator: hasMinLength },
  { label: 'At least one uppercase letter', validator: hasUpperCase },
  { label: 'At least one lowercase letter', validator: hasLowerCase },
  { label: 'At least one number', validator: hasNumber },
  { label: 'At least one special character', validator: hasSpecialChar },
];

export default function SignUpPage({ setAuthorization }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.validator(formData.password));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store email and name for verification
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`);
        
        // Update authorization state
        setAuthorization(true);
        
        // Dispatch storage event manually since we're in the same window
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'userEmail',
          newValue: formData.email
        }));
        
        // Navigate to verification page
        navigate(`/verify?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(data.message || data.error || 'Sign up failed');
      }
    } catch (err) {
      setError('An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 },
        position: 'relative',
      }}
    >
      {/* Back arrow for mobile only */}
      {isMobile && (
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 2,
            '&:hover': {
              backgroundColor: theme.palette.background.paper,
              boxShadow: 4,
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      <Container maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2.5, sm: 3 },
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom 
            align="center"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
            }}
          >
            Sign Up
          </Typography>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            align="center" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '0.875rem', sm: '0.875rem' },
            }}
          >
            Create your account to get started
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSignUp}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="dense"
              size="medium"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                }
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="dense"
              size="medium"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                }
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="dense"
              size="medium"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="dense"
              size="medium"
              required
              helperText="Password must meet all requirements below"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: { xs: '0.75rem', sm: '0.75rem' },
                }
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="dense"
              size="medium"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '1rem', sm: '1rem' },
                }
              }}
            />

            {/* Password Requirements List */}
            <List 
              dense 
              sx={{ 
                width: '100%', 
                bgcolor: 'background.paper', 
                mt: { xs: 0.5, sm: 1 }, 
                mb: { xs: 0.5, sm: 1 },
                px: { xs: 0, sm: 0 }
              }}
            >
              {passwordRequirements.map((req, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    py: { xs: 0.25, sm: 0.5 },
                    px: { xs: 0, sm: 2 }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 } }}>
                    {req.validator(formData.password) ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={req.label}
                    primaryTypographyProps={{
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      color: req.validator(formData.password) ? 'success.main' : 'error.main'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Box 
              sx={{ 
                textAlign: 'center',
                mt: { xs: 1.5, sm: 2 },
                mb: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                By signing up, you agree to our{' '}
                <Link
                  component={RouterLink}
                  to="/privacy-policy"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Privacy Policy
                </Link>
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !isPasswordValid()}
              sx={{ 
                mt: 0,
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>

            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: { xs: 2, sm: 2.5 },
              }}
            >
              <Link 
                component={RouterLink} 
                to="/sign-in" 
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}