import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: '1st Place', to: '/data/first-place' },
  { label: '2nd Place', to: '/data/second-place' },
  { label: '3rd Place', to: '/data/third-place' },
];

const Board = () => (
  <Box sx={{ width: 220, bgcolor: '#f5f5f5', height: '100vh', pt: '90px', position: 'fixed', left: 0, top: 0, borderRight: '1px solid #ddd' }}>
    <List>
      {navItems.map((item) => (
        <ListItem key={item.to} disablePadding>
          <ListItemButton component={NavLink} to={item.to} sx={{ '&.active': { bgcolor: '#e0e0e0' } }}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Box>
);

export default Board; 