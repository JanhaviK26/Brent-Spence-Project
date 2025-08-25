import React from 'react';
import Chart from './Chart';
import { Box, Paper } from '@mui/material';

const FirstPlace = () => (
  <Box sx={{ p: 0, pt: 1, maxWidth: 900, mx: 'auto', minWidth: 0 }}>
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Chart compact />
    </Paper>
  </Box>
);

export default FirstPlace; 