import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Box,
  Typography,
  Container,
  useTheme,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            COTS UI
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/sign-in')}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/signup')}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url("/iStock-2148264573.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1,
          }
        }}
      >
        <Container 
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: 2,
              mb: 10
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.75rem' },
                mb: 1,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Smart Money Tracker - COTS Analytics
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                mb: 24,
                maxWidth: '800px',
                mx: 'auto',
                color: '#fff',
              }}
            >
              Built by traders for traders.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
          }}
        >
          {[
            {
              title: 'Real-time Data',
              description: 'Access up-to-date market data and trends with our comprehensive dashboard.',
            },
            {
              title: 'Advanced Analytics',
              description: 'Follow institutional money flow with precise tracking of commercial trader positions.',
            },
            {
              title: 'Market Insights',
              description: 'Spot key market reversals and trends with our proprietary analysis tools.',
            },
            {
              title: 'Direct Support',
              description: 'Get exclusive Discord access and direct support from our app developers.',
            },
          ].map((feature, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2.5,
                textAlign: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#fff',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="h5" 
                component="h3" 
                gutterBottom
                sx={{
                  fontSize: { xs: '1.25rem', md: '1.4rem' },
                }}
              >
                {feature.title}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
} 