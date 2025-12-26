import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Dialog,
  Typography,
  TextField,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { API_BASE_URL } from '../config';

const REQUEST_TYPES = [
  { value: 'question', label: 'Question', icon: <QuestionAnswerIcon fontSize="small" /> },
  { value: 'feature', label: 'Feature Request', icon: <LightbulbIcon fontSize="small" /> },
  { value: 'symbol', label: 'Symbol Request', icon: <AddCircleOutlineIcon fontSize="small" /> },
];

// Gold color from landing page
const GOLD_COLOR = '#cbb26a';
const DARK_BG = '#1a1a1a';

const HelpChat = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Expose openModal method to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
  }));

  const handleClose = () => {
    setOpen(false);
  };

  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setRequestType(newType);
      // Update subject placeholder based on type
      if (newType === 'feature') {
        setSubject('');
      } else if (newType === 'symbol') {
        setSubject('');
      } else {
        setSubject('');
      }
    }
  };

  const getPlaceholders = () => {
    switch (requestType) {
      case 'feature':
        return {
          subject: 'Feature name (e.g., "Dark mode toggle")',
          message: 'Describe the feature you\'d like to see and how it would help you...',
        };
      case 'symbol':
        return {
          subject: 'Symbol (e.g., "Lean Hogs - LH")',
          message: 'Tell us which symbol/instrument you\'d like us to add...',
        };
      default:
        return {
          subject: 'Brief summary of your question',
          message: 'How can we help you?',
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setSnackbar({ open: true, message: 'Please enter a message', severity: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const email = localStorage.getItem('userEmail') || 'anonymous';

      const response = await fetch(`${API_BASE_URL}/api/help/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: requestType,
          subject: subject.trim() || getPlaceholders().subject,
          message: message.trim(),
          userEmail: email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSnackbar({
          open: true,
          message: 'Thanks! We\'ve received your message and will get back to you soon.',
          severity: 'success'
        });
        // Reset form
        setSubject('');
        setMessage('');
        handleClose();
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again or email us directly.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeholders = getPlaceholders();

  return (
    <>
      {/* Modal Dialog - Black & Gold Theme */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: DARK_BG,
            border: `1px solid rgba(203, 178, 106, 0.3)`,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        {/* Header - Gold Gradient */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, rgba(203, 178, 106, 0.15) 0%, rgba(203, 178, 106, 0.05) 100%)`,
            borderBottom: `1px solid rgba(203, 178, 106, 0.2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupportAgentIcon sx={{ color: GOLD_COLOR }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
              Help & Feedback
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content - Dark Theme */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, background: DARK_BG }}>
          {/* Request Type Toggle */}
          <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'rgba(255, 255, 255, 0.6)' }}>
            What would you like to send?
          </Typography>
          <ToggleButtonGroup
            value={requestType}
            exclusive
            onChange={handleTypeChange}
            aria-label="request type"
            size="small"
            fullWidth
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                textTransform: 'none',
                py: 1,
                gap: 0.5,
                fontSize: '0.75rem',
                '&.Mui-selected': {
                  color: GOLD_COLOR,
                  backgroundColor: 'rgba(203, 178, 106, 0.1)',
                  borderColor: GOLD_COLOR,
                  '&:hover': {
                    backgroundColor: 'rgba(203, 178, 106, 0.15)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }
            }}
          >
            {REQUEST_TYPES.map((type) => (
              <ToggleButton
                key={type.value}
                value={type.value}
              >
                {type.icon}
                {type.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Subject Field */}
          <TextField
            fullWidth
            size="small"
            label="Subject"
            placeholder={placeholders.subject}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(203, 178, 106, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: GOLD_COLOR,
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.5)',
                '&.Mui-focused': {
                  color: GOLD_COLOR,
                }
              },
              '& .MuiOutlinedInput-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          />

          {/* Message Field */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            placeholder={placeholders.message}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(203, 178, 106, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: GOLD_COLOR,
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.5)',
                '&.Mui-focused': {
                  color: GOLD_COLOR,
                }
              },
              '& .MuiOutlinedInput-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          />

          {/* User Email Display */}
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 2, color: 'rgba(255, 255, 255, 0.5)' }}
          >
            We'll respond to: <span style={{ color: GOLD_COLOR }}>{localStorage.getItem('userEmail') || 'your registered email'}</span>
          </Typography>

          {/* Submit Button - Gold */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting || !message.trim()}
            endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              py: 1.25,
              background: `linear-gradient(135deg, ${GOLD_COLOR} 0%, #a89550 100%)`,
              color: '#1a1a1a',
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, #d4c078 0%, ${GOLD_COLOR} 100%)`,
              },
              '&.Mui-disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </Box>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

HelpChat.displayName = 'HelpChat';

export default HelpChat;
