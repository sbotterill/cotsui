import * as React from 'react';
import {
  Button,
  FormControl,
  Checkbox,
  FormControlLabel,
  InputLabel,
  OutlinedInput,
  TextField,
  InputAdornment,
  Link,
  Alert,
  IconButton,
  Box,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const providers = [{ id: 'credentials', name: 'Email and Password' }];

function CustomFirstNameField() {
  return (
    <TextField
      id="input-with-icon-textfield"
      label="First Name"
      name="firstName"
      type="text"
      size="small"
      required
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon fontSize="inherit" />
            </InputAdornment>
          ),
        },
      }}
      variant="outlined"
    />
  );
}

function CustomLastNameField() {
  return (
    <TextField
      id="input-with-icon-textfield"
      label="Last Name"
      name="lastName"
      type="text"
      size="small"
      required
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon fontSize="inherit" />
            </InputAdornment>
          ),
        },
      }}
      variant="outlined"
    />
  );
}

function CustomEmailField() {
  return (
    <TextField
      id="input-with-icon-textfield"
      label="Email"
      name="email"
      type="email"
      size="small"
      required
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <AccountCircle fontSize="inherit" />
            </InputAdornment>
          ),
        },
      }}
      variant="outlined"
    />
  );
}

function CustomPasswordField() {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <FormControl sx={{ my: 2 }} fullWidth variant="outlined">
      <InputLabel size="small" htmlFor="outlined-adornment-password">
        Password
      </InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        size="small"
        required
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              size="small"
            >
              {showPassword ? (
                <VisibilityOff fontSize="inherit" />
              ) : (
                <Visibility fontSize="inherit" />
              )}
            </IconButton>
          </InputAdornment>
        }
        label="Password"
      />
    </FormControl>
  );
}

function CustomButton() {
  return (
    <Button
      type="submit"
      variant="outlined"
      color="info"
      size="small"
      disableElevation
      fullWidth
      sx={{ my: 2 }}
    >
      Sign Up
    </Button>
  );
}

function SignInLink() {
  return (
    <Link component={RouterLink} to="/" variant="body2">
      Already have an account? Sign in
    </Link>
  );
}

function Title() {
  return <h2 style={{ marginBottom: 8 }}>Sign Up</h2>;
}

export default function SignUpPage() {
  const theme = useTheme();
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignUp = async (provider, formData) => {
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
        localStorage.setItem('userEmail', formData.get('email'));
        localStorage.setItem('userName', `${formData.get('firstName')} ${formData.get('lastName')}`);
        window.location.href = '/';
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
    <AppProvider theme={theme}>
      <SignInPage
        signIn={handleSignUp}
        slots={{
          title: Title,
          firstNameField: CustomFirstNameField,
          lastNameField: CustomLastNameField,
          emailField: CustomEmailField,
          passwordField: CustomPasswordField,
          submitButton: CustomButton,
          signInLink: SignInLink,
        }}
        slotProps={{ 
          form: { noValidate: true },
          submitButton: { disabled: isLoading }
        }}
        providers={providers}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </AppProvider>
  );
}