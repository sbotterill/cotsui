import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function PrivacyPolicy() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => navigate(-1)}
        sx={{
          mb: 2,
          color: theme.palette.primary.main,
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
            }}
          >
            Privacy Policy
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>

          <Box sx={{ '& > *': { mb: 3 } }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                1. Introduction
              </Typography>
              <Typography variant="body1" paragraph>
                Welcome to COTS UI. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                2. Information We Collect
              </Typography>
              <Typography variant="body1" paragraph>
                We collect information that you provide directly to us, including:
              </Typography>
              <Typography variant="body1" component="div" sx={{ pl: 2 }}>
                <ul>
                  <li>Name and contact information (email address)</li>
                  <li>Account credentials</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Usage data and preferences</li>
                </ul>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                3. How We Use Your Information
              </Typography>
              <Typography variant="body1" paragraph>
                We use the information we collect to:
              </Typography>
              <Typography variant="body1" component="div" sx={{ pl: 2 }}>
                <ul>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your transactions</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                </ul>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                4. Information Sharing
              </Typography>
              <Typography variant="body1" paragraph>
                We do not sell or rent your personal information to third parties. We may share your information with:
              </Typography>
              <Typography variant="body1" component="div" sx={{ pl: 2 }}>
                <ul>
                  <li>Service providers who assist in operating our platform (e.g., Stripe for payment processing)</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a business transfer or acquisition</li>
                </ul>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                5. Data Security
              </Typography>
              <Typography variant="body1" paragraph>
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                6. Your Rights
              </Typography>
              <Typography variant="body1" paragraph>
                You have the right to:
              </Typography>
              <Typography variant="body1" component="div" sx={{ pl: 2 }}>
                <ul>
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data</li>
                </ul>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                7. Cookies and Tracking
              </Typography>
              <Typography variant="body1" paragraph>
                We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                8. Children's Privacy
              </Typography>
              <Typography variant="body1" paragraph>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                9. Changes to This Policy
              </Typography>
              <Typography variant="body1" paragraph>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                10. Contact Us
              </Typography>
              <Typography variant="body1" paragraph>
                If you have questions about this Privacy Policy, please contact us at:
              </Typography>
              <Typography variant="body1" sx={{ pl: 2 }}>
                Email: [YOUR EMAIL ADDRESS]
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

