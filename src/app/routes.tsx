import { lazy, type JSX } from 'react';

const VendorDashboard = lazy(() => import('../domains/vendor/ui/dashboard/dashboard'));
// const About = lazy(() => import("../pages/About"));

export const ProtectedRoutes: ProtectedRoute[] = [
  {
    path: '/',
    element: <>test 1</>,
    label: 'Home',
  },
  {
    path: '/vendor-dashboard',
    element: <VendorDashboard />,
    label: 'Dashboard',
  },
];

export type ProtectedRoute = {
  path: string;
  element: JSX.Element;
  label: string;
};
