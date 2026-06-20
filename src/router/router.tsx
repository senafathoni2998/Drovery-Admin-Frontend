import { createBrowserRouter } from 'react-router';

import ComingSoonPage from '../pages/ComingSoon/ComingSoonPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LoginPage from '../pages/Login/LoginPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import ProtectedRoute from '../layout/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/deliveries', element: <ComingSoonPage title="Deliveries" /> },
      { path: '/promos', element: <ComingSoonPage title="Promos" /> },
      { path: '/users', element: <ComingSoonPage title="Users" /> },
      { path: '/support', element: <ComingSoonPage title="Support" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
