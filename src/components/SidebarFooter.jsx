import * as React from 'react';
import { Box, Divider, Tooltip, IconButton } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Profile from './Profile';

export default function SidebarFooter({ onSupportClick, mini }) {
  return (
    <Box sx={{
      py: 1.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      gap: 0.5,
    }}>
      <Divider sx={{ width: '80%', mb: 1 }} />

      {/* Help Button */}
      <Tooltip title="Help & Feedback" placement="right" arrow>
        <IconButton
          onClick={onSupportClick}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            color: '#cbb26a',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <SupportAgentIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Profile Button */}
      <Profile />
    </Box>
  );
}
