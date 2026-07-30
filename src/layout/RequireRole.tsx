import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useAppSelector } from '../app/hooks';
import { homePathForRole, rolesForPath } from './navItems';

/**
 * Per-route role guard, sitting inside ProtectedRoute (which has already established
 * that there IS a staff session).
 *
 * Without it every authenticated user landed on `/` — the ADMIN-only Dashboard — so
 * an AGENT signing in to work support tickets hit a permanent 403 with nothing in
 * their sidebar to explain it. Rather than showing them an error, send them where
 * they can actually work.
 *
 * Allowed roles come from NAV_ITEMS, so a route cannot be advertised in the nav under
 * one rule and guarded under another.
 */
export default function RequireRole({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const { pathname } = useLocation();

  if (!user) return null; // ProtectedRoute owns the unauthenticated case.

  const allowed = rolesForPath(pathname);
  if (allowed.length > 0 && !allowed.includes(user.role)) {
    const home = homePathForRole(user.role);
    // Guard against a redirect loop if a role somehow has no reachable page.
    return home === pathname ? null : <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
