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
  useMediaQuery,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(68, 79, 90, 0.7)',
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(68, 79, 90, 0.7)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box
            component="img"
            src="/noBgColor.png"
            alt="COTS UI Logo"
            sx={{
              height: { xs: '32px', sm: '40px' },
              width: 'auto',
              cursor: 'pointer',
            }}
          />
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/sign-in')}
              sx={{
                background: '#cbb26a',
                color: '#fff',
                '&:hover': {
                  background: '#b8a05a',
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
          minHeight: { xs: '100vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url("/AdobeStock_842920994.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pt: { xs: '64px', sm: '80px' },
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
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 3, sm: 4 },
              px: { xs: 2.5, sm: 4 },
              mb: { xs: 4, md: 10 },
              backgroundColor: 'rgba(68, 79, 90, 0.7)',
              borderRadius: { xs: 3, sm: 4 },
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 2,
                color: '#fff',
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              CFTC Commitment of Traders Report Viewer
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                color: '#fff',
                opacity: 0.9,
                mb: { xs: 3, sm: 4 },
                lineHeight: 1.6,
              }}
            >
              Designed to make government-reported data more accessible and actionable.
            </Typography>

            {/* Mobile CTA Buttons */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 2,
                mt: 3,
                px: { xs: 1, sm: 4 }
              }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/sign-in')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: '#cbb26a',
                    color: '#fff',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(203, 178, 106, 0.4)',
                    '&:hover': {
                      background: '#b8a05a',
                      boxShadow: '0 6px 16px rgba(203, 178, 106, 0.6)',
                    }
                  }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{
                    borderColor: '#fff',
                    borderWidth: 2,
                    color: '#fff',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#fff',
                      borderWidth: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    }
                  }}
                >
                  Create Account
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {[
            {
              title: 'Market Insights',
              description: 'Spot market trends and reversals with our unique market research tools.',
            },
            {
              title: 'Real-time Data',
              description: 'Access continuously updated financial data through our intuitive dashboard.',
            },
            {
              title: 'Advanced Analytics',
              description: 'Visualize institutional market activity using aggregated trader sentiment indicators.',
            },
            {
              title: 'Discord Community',
              description: 'Join our exclusive Discord server for direct support and market discussions.',
            },
          ].map((feature, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                textAlign: 'center',
                backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#fff',
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: { xs: '140px', sm: '160px' },
              }}
            >
              <Typography 
                variant="h5" 
                component="h3" 
                gutterBottom
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                  mb: { xs: 1, sm: 1.5 },
                  fontWeight: 600,
                }}
              >
                {feature.title}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                  lineHeight: 1.5,
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