import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';

import PageLoader from '../components/PageLoader';
import ProtectedRoute from '../layout/ProtectedRoute';

// Route pages are code-split — each becomes its own chunk loaded on navigation. The shell
// (ProtectedRoute + AppLayout) stays eager; AppLayout wraps <Outlet/> in its own Suspense, so
// protected pages load with the nav still visible. Top-level routes use withSuspense below.
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const DeliveriesListPage = lazy(
  () => import('../pages/Deliveries/DeliveriesListPage'),
);
const DeliveryDetailPage = lazy(
  () => import('../pages/Deliveries/DeliveryDetailPage'),
);
const PromosListPage = lazy(() => import('../pages/Promos/PromosListPage'));
const UsersListPage = lazy(() => import('../pages/Users/UsersListPage'));
const SupportListPage = lazy(() => import('../pages/Support/SupportListPage'));
const SupportTicketDetailPage = lazy(
  () => import('../pages/Support/SupportTicketDetailPage'),
);
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'));

// For routes NOT under AppLayout (no shared Outlet boundary), give each its own Suspense.
const withSuspense = (node: ReactNode): ReactNode => (
  <Suspense fallback={<PageLoader />}>{node}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/deliveries', element: <DeliveriesListPage /> },
      { path: '/deliveries/:id', element: <DeliveryDetailPage /> },
      { path: '/promos', element: <PromosListPage /> },
      { path: '/users', element: <UsersListPage /> },
      { path: '/support', element: <SupportListPage /> },
      { path: '/support/:id', element: <SupportTicketDetailPage /> },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
