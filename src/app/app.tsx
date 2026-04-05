import { AppProvider } from './provider';
import { AppRouter } from './router';
import './index.css';
export const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};
