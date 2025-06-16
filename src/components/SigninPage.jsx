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
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const providers = [{ id: 'credentials', name: 'Email and Password' }];

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
      Log In
    </Button>
  );
}

function SignUpLink() {
  return (
    <Link component={RouterLink} to="/signup" variant="body2">
      Sign up
    </Link>
  );
}

function ForgotPasswordLink() {
  return (
    <Link component={RouterLink} to="/forgot-password" variant="body2">
      Forgot password?
    </Link>
  );
}

function Title() {
  return <h2 style={{ marginBottom: 8 }}>Login</h2>;
}

function Subtitle() {
  return (
    <Alert sx={{ mb: 2, px: 1, py: 0.25, width: '100%' }} severity="warning">
      We are investigating an ongoing outage.
    </Alert>
  );
}

function RememberMeCheckbox() {
  const theme = useTheme();
  return (
    <FormControlLabel
      label="Remember me"
      control={
        <Checkbox
          name="remember"
          value="true"
          color="primary"
          sx={{ padding: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }}
        />
      }
      slotProps={{
        typography: {
          color: 'textSecondary',
          fontSize: theme.typography.pxToRem(14),
        },
      }}
    />
  );
}

function ErrorAlert({ error, onClose }) {
  if (!error) return null;
  
  return (
    <Alert
      severity="error"
      sx={{
        width: '100%',
        boxShadow: 1,
        borderRadius: 1,
        mt: 2
      }}
      onClose={onClose}
    >
      {error}
    </Alert>
  );
}

export default function SlotsSignIn(props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignIn = async (provider, formData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const email = formData.get('email');
      const password = formData.get('password');

      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/permissions?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          if (data.message.includes('verify your email')) {
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
            fetch(`${API_BASE_URL}/preferences?email=${encodeURIComponent(email)}`),
            fetch(`${API_BASE_URL}/preferences/favorites?email=${encodeURIComponent(email)}`)
          ]);

          if (prefsResponse.ok) {
            const prefsData = await prefsResponse.json();
          }

          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            // Store initial favorites in localStorage to ensure they're available on first load
            if (favoritesData.favorites?.selected) {
              console.log('Storing initial favorites:', favoritesData.favorites.selected);
              localStorage.setItem('initialFavorites', JSON.stringify(favoritesData.favorites.selected));
            } else {
              console.log('No favorites found in response:', favoritesData);
              localStorage.setItem('initialFavorites', JSON.stringify([]));
            }
          } else {
            console.log('Failed to load favorites:', await favoritesResponse.text());
            localStorage.setItem('initialFavorites', JSON.stringify([]));
          }
        } catch (prefsError) {
          console.error('Error loading preferences:', prefsError);
          localStorage.setItem('initialFavorites', JSON.stringify([]));
        }
        
        props.setAuthorization(true);
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
    <AppProvider theme={theme}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh'
      }}>
        <SignInPage
          signIn={handleSignIn}
          sx={{
            width: '475px',
            minHeight: '600px',
            padding: '32px',
          }}
          slots={{
            title: Title,
            emailField: CustomEmailField,
            passwordField: CustomPasswordField,
            submitButton: CustomButton,
            signUpLink: SignUpLink,
            rememberMe: RememberMeCheckbox,
            forgotPasswordLink: ForgotPasswordLink,
            subtitle: () => <ErrorAlert error={error} onClose={() => setError(null)} />
          }}
          slotProps={{ 
            form: { noValidate: true },
            submitButton: { disabled: isLoading }
          }}
          providers={providers}
        />
      </div>
    </AppProvider>
  );
}
