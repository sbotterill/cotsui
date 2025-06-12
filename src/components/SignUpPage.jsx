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
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.validator(password));
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    if (!isPasswordValid()) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          first_name: formData.get('firstName'),
          last_name: formData.get('lastName')
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Use React Router navigation instead of window.location
        navigate(`/verify?email=${encodeURIComponent(formData.get('email'))}`);
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check if the server is running.');
      } else {
        setError('An error occurred during sign up.');
      }
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading || !isPasswordValid()}
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
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