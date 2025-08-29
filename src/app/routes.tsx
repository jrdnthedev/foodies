import { type JSX } from 'react';

// const Home = lazy(() => import("../pages/Home"));
// const About = lazy(() => import("../pages/About"));

export const ProtectedRoutes: ProtectedRoute[] = [
  {
    path: '/',
    element: <>test 1</>,
  },
  {
    path: '/about',
    element: <>test 2</>,
  },
];

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/vendor-dashboard', label: 'Dashboard' },
];

export type ProtectedRoute = {
  path: string;
  element: JSX.Element;
};
