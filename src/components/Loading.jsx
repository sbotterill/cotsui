import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function CircularLoading () {
  return (
    <Box sx={{ display: 'flex', height: "100%"}}>
      <CircularProgress />
    </Box>
  );
}
