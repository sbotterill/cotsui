import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

export default function HowItWorksVideo({ open, onClose }) {
  const theme = useTheme();

  // Replace this with your actual YouTube video ID
  const youtubeVideoId = 'https://youtu.be/QWkFgL3sd2A'; // You'll need to replace this with your actual video ID

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 3, 
        pb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          How COTS UI Works
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.grey[500],
            '&:hover': {
              color: theme.palette.grey[700],
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1, maxHeight: '80vh', overflow: 'hidden' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Learn how COTS UI helps you track institutional money flow and make better trading decisions.
          </Typography>
        </Box>
        
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 0,
            paddingBottom: '56.25%', // 16:9 aspect ratio
            backgroundColor: '#000',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
            title="How COTS UI Works"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
            Key Benefits:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              <strong>Real-time CFTC Data:</strong> Access the latest Commitment of Traders reports as soon as they're published
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              <strong>Smart Money Tracking:</strong> Follow institutional and commercial trader positions to identify market trends
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              <strong>Advanced Analytics:</strong> Visualize position changes and identify potential market reversals
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              <strong>Customizable Dashboard:</strong> Filter by exchanges and commodities to focus on your preferred markets
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              <strong>Professional Support:</strong> Get direct access to our Discord community for questions and insights
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 