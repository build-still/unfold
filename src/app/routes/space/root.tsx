import { Outlet } from 'react-router';

import { SpaceLayout } from './space-layout';

export const ErrorBoundary = () => {
  return <div>Something went wrong!</div>;
};

const AppRoot = () => {
  return (
    <SpaceLayout>
      <Outlet />
    </SpaceLayout>
  );
};

export default AppRoot;
