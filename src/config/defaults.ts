import type { AppConfig, ConfigPatch } from './types';

const CONFIG_DEFAULT_VALUES = {
  sidebar: {
    position: 'left',
    width: 196,
  },
  theme: 'system',
} satisfies AppConfig;

export const CONFIG_DEFAULTS = Object.freeze(CONFIG_DEFAULT_VALUES);

export const mergeWithConfigDefaults = (
  value: ConfigPatch | undefined,
): AppConfig => {
  return {
    sidebar: {
      ...CONFIG_DEFAULTS.sidebar,
      ...(value?.sidebar ?? {}),
    },
    theme: value?.theme ?? CONFIG_DEFAULTS.theme,
  };
};

export const applyConfigPatch = (
  current: AppConfig,
  patch: ConfigPatch,
): AppConfig => {
  return mergeWithConfigDefaults({
    theme: patch.theme ?? current.theme,
    sidebar: {
      ...current.sidebar,
      ...(patch.sidebar ?? {}),
    },
  });
};
