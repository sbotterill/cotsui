import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name, isDarkMode) {
  const nameParts = name.split(' ');
  const initials = nameParts.length >= 2 
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : nameParts[0].substring(0, 2).toUpperCase();

  return {
    sx: {
      bgcolor: isDarkMode ? '#2a2a2a' : '#fff',
      color: isDarkMode ? '#fff' : '#000',
      border: '1px solid',
      borderColor: isDarkMode ? '#fff' : '#000',
    },
    children: initials,
  };
}

export default function BackgroundLetterAvatars({ onProfileClick }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const userName = localStorage.getItem('userName') || 'User Name';

  return (
    <Stack sx={{ marginRight: '20px' }} direction="row" spacing={2}>
      <Avatar 
        onClick={onProfileClick} 
        sx={{ 
          width: 32, 
          height: 32, 
          transition: 'transform 0.2s ease',
          '&:hover': { 
            transform: 'scale(1.1)',
            cursor: 'pointer'
          }
        }} 
        {...stringAvatar(userName, isDarkMode)} 
      />
    </Stack>
  );
}
