import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { applyConfigPatch, CONFIG_DEFAULTS } from './defaults';
import {
  getConfig,
  resetConfig as resetConfigOnDisk,
  setConfig as persistConfig,
} from './invoke';
import type { AppConfig, ConfigPatch } from './types';

const CONFIG_QUERY_KEY = ['settings', 'config'] as const;

type ConfigContextValue = {
  config: AppConfig;
  updateConfig: (patch: ConfigPatch) => Promise<AppConfig>;
  resetConfig: () => Promise<AppConfig>;
};

const ConfigContext = React.createContext<ConfigContextValue | null>(null);

const applyTheme = (theme: AppConfig['theme']) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const resolvedTheme =
    theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.setAttribute('data-theme', resolvedTheme);
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: config = CONFIG_DEFAULTS } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: getConfig,
    initialData: CONFIG_DEFAULTS,
  });

  React.useEffect(() => {
    applyTheme(config.theme);

    // Keep system theme mode in sync when the OS theme changes at runtime.
    if (config.theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', onMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', onMediaChange);
    };
  }, [config.theme]);

  const updateConfig = async (patch: ConfigPatch) => {
    const previous =
      queryClient.getQueryData<AppConfig>(CONFIG_QUERY_KEY) ?? CONFIG_DEFAULTS;
    const next = applyConfigPatch(previous, patch);

    queryClient.setQueryData(CONFIG_QUERY_KEY, next);

    try {
      const persisted = await persistConfig(next);
      queryClient.setQueryData(CONFIG_QUERY_KEY, persisted);
      return persisted;
    } catch (error) {
      queryClient.setQueryData(CONFIG_QUERY_KEY, previous);
      throw error;
    }
  };

  const handleResetConfig = async () => {
    const restored = await resetConfigOnDisk();
    queryClient.setQueryData(CONFIG_QUERY_KEY, restored);
    return restored;
  };

  const value: ConfigContextValue = {
    config,
    updateConfig,
    resetConfig: handleResetConfig,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = React.useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within ConfigProvider.');
  }

  return context;
};
