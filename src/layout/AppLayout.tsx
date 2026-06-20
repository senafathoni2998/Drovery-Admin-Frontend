import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import type { Role } from '../models/enums';

const DRAWER_WIDTH = 232;

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, roles: ['ADMIN'] },
  {
    label: 'Deliveries',
    path: '/deliveries',
    icon: <LocalShippingIcon />,
    roles: ['ADMIN'],
  },
  { label: 'Promos', path: '/promos', icon: <LocalOfferIcon />, roles: ['ADMIN'] },
  { label: 'Users', path: '/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
  {
    label: 'Support',
    path: '/support',
    icon: <SupportAgentIcon />,
    roles: ['AGENT', 'ADMIN'],
  },
];

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  const items = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Drovery&nbsp;<Box component="span" sx={{ color: 'primary.main' }}>Admin</Box>
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              {user.name} · {user.role}
            </Typography>
          )}
          <Button
            size="small"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => dispatch(logout())}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1 }}>
          {items.map((item) => {
            const selected =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
