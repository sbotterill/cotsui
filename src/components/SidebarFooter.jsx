import * as React from 'react';
import { Box, Divider, Typography, Tooltip, IconButton } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Profile from './Profile';

export default function SidebarFooter({ onSupportClick, mini }) {
  return (
    <Box sx={{
      p: mini ? 1 : 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: mini ? 'center' : 'stretch',
    }}>
      <Divider sx={{ mb: 1.5, width: '100%' }} />

      {/* Support Section */}
      {!mini && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.7, px: 1 }}>
          Support
        </Typography>
      )}

      <Tooltip title="Help & Feedback" placement="right" arrow disableHoverListener={!mini}>
        <IconButton
          onClick={onSupportClick}
          sx={{
            width: mini ? 40 : '100%',
            height: 40,
            borderRadius: 1,
            display: 'flex',
            justifyContent: mini ? 'center' : 'flex-start',
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
        <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.7 }}>
          Account
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: mini ? 'center' : 'flex-start' }}>
        <Profile />
      </Box>
    </Box>
  );
}
