import { lazy, type JSX } from 'react';

const VendorDashboard = lazy(() => import('../domains/vendor/ui/dashboard/dashboard'));
const VendorProfile = lazy(() => import('../domains/vendor/ui/profile/profile'));
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
  {
    path: '/vendor/:vendorId',
    element: <VendorProfile />,
    label: 'Vendor Profile',
  },
];

export type ProtectedRoute = {
  path: string;
  element: JSX.Element;
  label: string;
};
