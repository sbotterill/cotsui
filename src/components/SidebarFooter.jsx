import * as React from 'react';
import { Box, Divider, Typography, Tooltip, IconButton } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Profile from './Profile';

export default function SidebarFooter({ onSupportClick, mini }) {
  return (
    <Box sx={{
      py: mini ? 1 : 2,
      px: mini ? 0 : 2, // No horizontal padding in mini mode for better centering
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    }}>
      <Divider sx={{ mb: 1.5, width: '100%' }} />

      {/* Support Section */}
      {!mini && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.7, px: 1, width: '100%' }}>
          Support
        </Typography>
      )}

      <Tooltip title="Help & Feedback" placement="right" arrow>
        <IconButton
          onClick={onSupportClick}
          sx={{
            width: mini ? 40 : '100%', // Fixed 40px in mini mode for centering
            height: 40,
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'center',
            px: mini ? 0 : 1.5,
            mb: 1.5,
            gap: 1.5,
            color: '#cbb26a',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <SupportAgentIcon fontSize="small" />
          {!mini && (
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Help & Feedback
            </Typography>
          )}
        </IconButton>
      </Tooltip>

      <Divider sx={{ mb: 1.5, width: '100%' }} />

      {/* Account Section */}
      {!mini && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.7, width: '100%' }}>
          Account
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Profile />
      </Box>
    </Box>
  );
}
