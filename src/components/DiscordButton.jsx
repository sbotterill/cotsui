import * as React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import DiscordIcon from '@mui/icons-material/Telegram'; // Using Telegram icon as a placeholder for Discord

export default function DiscordButton() {
  const theme = useTheme();

  const handleDiscordClick = () => {
    // Replace this with your actual Discord invite link
    window.open('https://discord.gg/cQczXyMf', '_blank');
  };

  return (
    <Tooltip title="For support, join our Discord community">
      <IconButton
        onClick={handleDiscordClick}
        sx={{
          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          '&:hover': {
            color: '#5865F2', // Discord brand color
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <DiscordIcon />
      </IconButton>
    </Tooltip>
  );
} 