import { createBrowserRouter } from 'react-router';

import ComingSoonPage from '../pages/ComingSoon/ComingSoonPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import DeliveriesListPage from '../pages/Deliveries/DeliveriesListPage';
import DeliveryDetailPage from '../pages/Deliveries/DeliveryDetailPage';
import LoginPage from '../pages/Login/LoginPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import PromosListPage from '../pages/Promos/PromosListPage';
import UsersListPage from '../pages/Users/UsersListPage';
import ProtectedRoute from '../layout/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/deliveries', element: <DeliveriesListPage /> },
      { path: '/deliveries/:id', element: <DeliveryDetailPage /> },
      { path: '/promos', element: <PromosListPage /> },
      { path: '/users', element: <UsersListPage /> },
      { path: '/support', element: <ComingSoonPage title="Support" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
