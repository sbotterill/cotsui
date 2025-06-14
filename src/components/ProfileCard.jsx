import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ThemeSwitch from './ThemeSwitch';
import Divider from '@mui/material/Divider';

export default function ProfileCard({ open, onClose }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const userEmail = localStorage.getItem('userEmail');

  if (!open) return null;

  return (
    <Box 
      sx={{ 
        position: 'absolute',
        top: '60px',
        right: '0',
        zIndex: 1000,
        minWidth: 275,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Card variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Logged in as:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {userEmail}
          </Typography>
        </Box>
        <Divider />
        <CardActions sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end', 
          p: 2,
          '& .MuiFormGroup-root': {
            alignItems: 'flex-end'
          }
        }}>
          <Box sx={{ 
            width: '100%', 
            mb: 2, 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Typography>
            <ThemeSwitch />
          </Box>
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <Button 
              size="small"
              onClick={() => {
                // TODO: Implement cancel subscription logic
              }}
            >
              Cancel Subscription
            </Button>
            <Button 
              size="small" 
              onClick={() => {
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                window.location.href = '/';
              }}
            >
              Sign Out
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Box>
  );
}
