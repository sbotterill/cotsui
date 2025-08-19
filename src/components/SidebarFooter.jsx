import * as React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import Profile from './Profile';

export default function SidebarFooter() {
  return (
    <Box sx={{ p: 2 }}>
      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.7 }}>
        Account
      </Typography>
      <Profile />
    </Box>
  );
}


