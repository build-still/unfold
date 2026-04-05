import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { enableMapSet } from 'immer';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';

import { MainErrorFallback } from '@/components/errors/main';
import { Spinner } from '@/components/ui/spinner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfigProvider } from '@/config/config-context';
import { KeybindingsProvider } from '@/config/keybindings-context';

enableMapSet();

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      }),
  );

  return (
    <div>
      <React.Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <ErrorBoundary FallbackComponent={MainErrorFallback}>
          <HelmetProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <ConfigProvider>
                  <KeybindingsProvider>
                    {import.meta.env.DEV && <ReactQueryDevtools />}
                    {children}
                  </KeybindingsProvider>
                </ConfigProvider>
              </TooltipProvider>
            </QueryClientProvider>
          </HelmetProvider>
        </ErrorBoundary>
      </React.Suspense>
    </div>
  );
};
