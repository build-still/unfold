import { useMemo } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/space/root';

import { paths } from '@/config/paths';

const SpaceOverviewRoute = () => {
  return <div>Select a node from the space.</div>;
};

const SpaceNodeRoute = () => {
  return <div>Node view</div>;
};

const NotFoundRoute = () => {
  return <div>Page not found.</div>;
};

const SpaceRouteLayout = () => {
  return <AppRoot />;
};

export const createAppRouter = () =>
  createBrowserRouter([
    {
      element: <Outlet />,
      children: [
        {
          element: <SpaceRouteLayout />,
          ErrorBoundary: AppRootErrorBoundary,
          children: [
            {
              // empty space
              path: paths.space.root.path,
              element: <SpaceOverviewRoute />,
            },
            {
              // space with nodes
              path: paths.space.node.path,
              element: <SpaceNodeRoute />,
            },
          ],
        },
        {
          path: '*',
          element: <NotFoundRoute />,
        },
      ],
    },
  ]);

export const AppRouter = () => {
  const router = useMemo(() => createAppRouter(), []);

  return <RouterProvider router={router} />;
};
