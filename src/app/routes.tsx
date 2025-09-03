import { lazy, type JSX } from 'react';

const VendorDashboard = lazy(() => import('../domains/vendor/ui/dashboard/dashboard'));
const VendorProfile = lazy(() => import('../domains/discovery/ui/profile/profile'));
const DiscoveryDashboard = lazy(() => import('../domains/discovery/ui/dashboard/dashboard'));
// const DiscoveryPage = lazy(() => import('../domains/discovery/ui/discovery-page/DiscoveryPage'));

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
  {
    path: '/discovery',
    element: <DiscoveryDashboard />,
    label: 'Discovery',
  },
];

export type ProtectedRoute = {
  path: string;
  element: JSX.Element;
  label: string;
};
