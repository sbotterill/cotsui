import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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

      if (data.success) {
        // Store email for verification
        localStorage.setItem('userEmail', formData.email);
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
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom align="center">
            Sign Up
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Create your account to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="dense"
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="dense"
              size="small"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="dense"
              size="small"
              required
              helperText="Password must meet all requirements below"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="dense"
              size="small"
              required
            />

            {/* Password Requirements List */}
            <List dense sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, mb: 1 }}>
              {passwordRequirements.map((req, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {req.validator(formData.password) ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={req.label}
                    primaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: req.validator(formData.password) ? 'success.main' : 'error.main'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !isPasswordValid()}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}