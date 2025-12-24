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
  Grid,
  Divider,
  IconButton,
  Fab,
  Zoom,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Custom hook for fade-in animation on scroll
const useFadeInOnScroll = () => {
  const ref = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
};

// Animated section wrapper component
const AnimatedSection = ({ children, delay = 0, fullHeight = false }) => {
  const { ref, isVisible } = useFadeInOnScroll();
  
  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        width: '100%',
        ...(fullHeight && { 
          height: '100%',
          display: 'flex',
          flex: 1,
        }),
      }}
    >
      {children}
    </Box>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        minHeight: 220,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(203, 178, 106, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(203, 178, 106, 0.2) 0%, rgba(203, 178, 106, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          flexShrink: 0,
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 24, color: '#cbb26a' } })}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 1,
          color: '#fff',
          flexShrink: 0,
          fontSize: '1.1rem',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.7,
          flexGrow: 1,
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
};

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const containerRef = React.useRef(null);

  // Track scroll position to show/hide back to top button
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowBackToTop(container.scrollTop > 400);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: <SmartToyIcon />,
      title: 'AI Assistant',
      description: 'Ask questions about market data in plain English. Our AI analyzes COT reports and seasonality patterns to provide actionable insights.',
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Z-Score Analysis',
      description: 'Identify extreme positioning with all-time and 5-year z-scores. Spot when commercials are unusually bullish or bearish.',
    },
    {
      icon: <ShowChartIcon />,
      title: 'Seasonality Charts',
      description: 'Visualize historical price patterns by month, election cycles, and custom date ranges. Find recurring opportunities.',
    },
    {
      icon: <SpeedIcon />,
      title: 'Real-time Data',
      description: 'Access the latest CFTC Commitment of Traders reports as soon as they\'re released every Friday at 3:30 PM EST.',
    },
    {
      icon: <AssessmentIcon />,
      title: 'COT Reports',
      description: 'Interactive tables with commercial, non-commercial, and retail positioning. Filter by exchange and search any commodity.',
    },
    {
      icon: <GroupsIcon />,
      title: 'Discord Community',
      description: 'Join traders sharing ideas, discussing market flow, and getting real-time support from the community.',
    },
  ];

  const pricingFeatures = [
    'Unlimited AI queries',
    'All COT report data',
    'Z-score analysis (all-time & 5-year)',
    'Seasonality charts & cycles',
    'Real-time data updates',
    'Discord community access',
    'Priority support',
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)',
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#0a0a0a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(203, 178, 106, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(203, 178, 106, 0.5)',
          },
        },
        // Firefox scrollbar
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(203, 178, 106, 0.3) #0a0a0a',
      }}
    >
      {/* Navigation Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4, md: 6 } }}>
          <Box
            component="img"
            src="/noBgColor.png"
            alt="COTS UI Logo"
            sx={{
              height: { xs: '32px', sm: '40px' },
              width: 'auto',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate('/sign-in')}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                '&:hover': {
                  color: '#fff',
                  background: 'transparent',
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/signup')}
              sx={{
                background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
                color: '#000',
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
                  boxShadow: '0 8px 24px rgba(203, 178, 106, 0.3)',
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        id="hero-section"
        sx={{
          position: 'relative',
          minHeight: { xs: '70vh', md: '65vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: '60px', md: '70px' },
          pb: { xs: 2, md: 4 },
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(203, 178, 106, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(203, 178, 106, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            <AnimatedSection>
              <Typography
                variant="overline"
                sx={{
                  color: '#cbb26a',
                  letterSpacing: 3,
                  fontWeight: 600,
                  mb: 2,
                  display: 'block',
                }}
              >
                CFTC DATA MADE SIMPLE
              </Typography>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Decode Institutional
                <br />
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #cbb26a 0%, #e8d590 50%, #cbb26a 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Market Flow
                </Box>
              </Typography>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.4rem' },
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  mb: 5,
                  maxWidth: '700px',
                  mx: 'auto',
                }}
              >
                Transform complex CFTC Commitment of Traders data into actionable trading insights 
                with AI-powered analysis, z-scores, and seasonality patterns.
              </Typography>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/signup')}
                  sx={{
                    background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
                    color: '#000',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
                      boxShadow: '0 12px 32px rgba(203, 178, 106, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing-section');
                    if (pricingSection && containerRef.current) {
                      const container = containerRef.current;
                      const offsetTop = pricingSection.offsetTop - 80; // Account for fixed navbar
                      container.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                  }}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 2,
                    color: '#fff',
                    fontWeight: 500,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderWidth: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  See Pricing
                </Button>
              </Box>
            </AnimatedSection>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 10 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#cbb26a',
                  letterSpacing: 3,
                  fontWeight: 600,
                  mb: 2,
                  display: 'block',
                }}
              >
                FEATURES
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  color: '#fff',
                  mb: 2,
                }}
              >
                Everything You Need
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.1rem',
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Powerful tools to analyze institutional positioning and find trading opportunities
              </Typography>
            </Box>
          </AnimatedSection>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {features.map((feature, index) => (
              <AnimatedSection delay={0.1 * index} key={index}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </AnimatedSection>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Product Screenshot Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#cbb26a',
                  letterSpacing: 3,
                  fontWeight: 600,
                  mb: 2,
                  display: 'block',
                }}
              >
                SEE IT IN ACTION
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  color: '#fff',
                  mb: 2,
                }}
              >
                Built for Traders
              </Typography>
            </Box>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
                background: 'linear-gradient(135deg, rgba(68, 79, 90, 0.8) 0%, rgba(40, 45, 50, 0.9) 100%)',
                p: { xs: 2, md: 4 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3,
                }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
              </Box>
              
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
                  borderRadius: 2,
                  p: { xs: 3, md: 5 },
                  minHeight: { xs: '200px', md: '400px' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 600,
                    mb: 2,
                    textAlign: 'center',
                  }}
                >
                  Interactive Dashboard
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    maxWidth: '500px',
                    mb: 3,
                  }}
                >
                  View COT reports, analyze z-scores, explore seasonality patterns, 
                  and get AI-powered insights all in one place.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Reports', 'Seasonality', 'AI Assistant'].map((item, i) => (
                    <Box
                      key={i}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        background: 'rgba(203, 178, 106, 0.1)',
                        border: '1px solid rgba(203, 178, 106, 0.3)',
                        color: '#cbb26a',
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing-section" sx={{ py: { xs: 8, md: 12 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#cbb26a',
                  letterSpacing: 3,
                  fontWeight: 600,
                  mb: 2,
                  display: 'block',
                }}
              >
                PRICING
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 700,
                  color: '#fff',
                  mb: 2,
                }}
              >
                Simple, Transparent Pricing
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1.1rem',
                  mb: 1,
                }}
              >
                Start with a 7-day free trial. Cancel anytime.
              </Typography>
              <Typography
                sx={{
                  color: '#cbb26a',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                No credit card required for free trial
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={4} justifyContent="center">
            {/* Monthly Plan */}
            <Grid item xs={12} md={5}>
              <AnimatedSection delay={0.1}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 5 },
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(203, 178, 106, 0.3)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    Monthly
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 1 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      $34.99
                    </Typography>
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        ml: 1,
                        fontSize: '1.1rem',
                      }}
                    >
                      /month
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      mb: 4,
                      fontSize: '0.9rem',
                    }}
                  >
                    Billed monthly
                  </Typography>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

                  <Box sx={{ textAlign: 'left', mb: 4 }}>
                    {pricingFeatures.map((feature, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1.5,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: '#cbb26a', fontSize: 18 }} />
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/signup')}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: 2,
                      color: '#fff',
                      fontWeight: 600,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#cbb26a',
                        borderWidth: 2,
                        backgroundColor: 'rgba(203, 178, 106, 0.1)',
                      },
                    }}
                  >
                    Start Free Trial
                  </Button>
                </Paper>
              </AnimatedSection>
            </Grid>

            {/* Annual Plan */}
            <Grid item xs={12} md={5}>
              <AnimatedSection delay={0.2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 5 },
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(203, 178, 106, 0.1) 0%, rgba(203, 178, 106, 0.02) 100%)',
                    border: '2px solid rgba(203, 178, 106, 0.4)',
                    borderRadius: 4,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Best Value Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: -35,
                      background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
                      color: '#000',
                      px: 4,
                      py: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      transform: 'rotate(45deg)',
                      letterSpacing: 1,
                    }}
                  >
                    BEST VALUE
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    Annual
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 1 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      $299.99
                    </Typography>
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        ml: 1,
                        fontSize: '1.1rem',
                      }}
                    >
                      /year
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: '#cbb26a',
                      mb: 4,
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    Save 29% vs monthly ($25/mo equivalent)
                  </Typography>

                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

                  <Box sx={{ textAlign: 'left', mb: 4 }}>
                    {pricingFeatures.map((feature, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1.5,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: '#cbb26a', fontSize: 18 }} />
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/signup')}
                    sx={{
                      background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
                      color: '#000',
                      fontWeight: 600,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 2,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
                        boxShadow: '0 12px 32px rgba(203, 178, 106, 0.4)',
                      },
                    }}
                  >
                    Start Free Trial
                  </Button>
                </Paper>
              </AnimatedSection>
            </Grid>
          </Grid>

        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 6,
          px: { xs: 2, md: 4 },
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/noBgColor.png"
                alt="COTS UI Logo"
                sx={{
                  height: '32px',
                  width: 'auto',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/sign-in')}
                sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#fff' } }}
              >
                Sign In
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/signup')}
                sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#fff' } }}
              >
                Sign Up
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/privacy-policy')}
                sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#fff' } }}
              >
                Privacy Policy
              </Button>
            </Box>

            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.875rem',
              }}
            >
              © {new Date().getFullYear()} COTS UI. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Floating Back to Top Button */}
      <Zoom in={showBackToTop}>
        <Fab
          size="medium"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: 'linear-gradient(135deg, #cbb26a 0%, #a89245 100%)',
            color: '#000',
            '&:hover': {
              background: 'linear-gradient(135deg, #d4bc74 0%, #b19a4e 100%)',
              boxShadow: '0 8px 24px rgba(203, 178, 106, 0.4)',
            },
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
