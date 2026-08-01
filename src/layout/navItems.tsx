import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlightIcon from '@mui/icons-material/Flight';
import PeopleIcon from '@mui/icons-material/People';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import type { ReactNode } from 'react';

import type { Role } from '../models/enums';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: Role[];
}

/**
 * The console's nav AND its route guards, from one list.
 *
 * They used to be separate: the sidebar filtered by role, but the routes themselves
 * were unguarded and `/` rendered the ADMIN-only Dashboard for everyone. An AGENT
 * signing in landed on a page that 403s forever, with no Dashboard entry in their
 * sidebar to explain why they were sent there.
 *
 * Deriving both from this list means a new page cannot appear in the nav without a
 * guard, or be guarded differently from how it is advertised.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, roles: ['ADMIN'] },
  {
    label: 'Deliveries',
    path: '/deliveries',
    icon: <LocalShippingIcon />,
    roles: ['ADMIN'],
  },
  {
    label: 'Promos',
    path: '/promos',
    icon: <LocalOfferIcon />,
    roles: ['ADMIN'],
  },
  { label: 'Users', path: '/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
  {
    label: 'Fleet',
    path: '/fleet',
    icon: <FlightIcon />,
    roles: ['ADMIN'],
  },
  {
    label: 'Support',
    path: '/support',
    icon: <SupportAgentIcon />,
    roles: ['AGENT', 'ADMIN'],
  },
];

/** Roles allowed on a route path. Detail routes inherit their list's rule. */
export function rolesForPath(path: string): Role[] {
  // Longest match first so '/deliveries/:id' resolves to '/deliveries', not '/'.
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => path === item.path || path.startsWith(`${item.path}/`));
  return match?.roles ?? [];
}

/**
 * Where a role should land. The first nav entry it can actually see — so an AGENT
 * goes to /support rather than to a Dashboard that will refuse them.
 */
export function homePathForRole(role: Role): string {
  return NAV_ITEMS.find((item) => item.roles.includes(role))?.path ?? '/support';
}
