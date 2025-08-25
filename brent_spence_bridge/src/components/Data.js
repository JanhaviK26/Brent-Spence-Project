import React from 'react';
import { Box } from '@mui/material';
import Board from './Board';
import { Outlet } from 'react-router-dom';

const Data = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Board />
      <Box sx={{ flex: 1, ml: '220px', minWidth: 0, p: 6, mt: '100px', minHeight: 'calc(100vh - 100px)' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Data;