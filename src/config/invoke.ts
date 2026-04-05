import { invoke } from '@tauri-apps/api/core';

import { CONFIG_DEFAULTS, mergeWithConfigDefaults } from './defaults';
import {
  KEYBINDINGS_DEFAULTS,
  mergeWithKeybindingDefaults,
  type KeybindingsConfig,
} from './keybindings-schema';
import type { AppConfig } from './types';

export const getConfig = async (): Promise<AppConfig> => {
  try {
    const config = await invoke<AppConfig>('get_config');
    return mergeWithConfigDefaults(config);
  } catch {
    return CONFIG_DEFAULTS;
  }
};

export const setConfig = async (config: AppConfig): Promise<AppConfig> => {
  const next = await invoke<AppConfig>('set_config', { config });
  return mergeWithConfigDefaults(next);
};

export const resetConfig = async (): Promise<AppConfig> => {
  const next = await invoke<AppConfig>('reset_config');
  return mergeWithConfigDefaults(next);
};

export const getKeybindings = async (): Promise<KeybindingsConfig> => {
  try {
    const keybindings = await invoke<KeybindingsConfig>('get_keybindings');
    return mergeWithKeybindingDefaults(keybindings);
  } catch {
    return KEYBINDINGS_DEFAULTS;
  }
};

export const setKeybindings = async (
  keybindings: KeybindingsConfig,
): Promise<KeybindingsConfig> => {
  const next = await invoke<KeybindingsConfig>('set_keybindings', {
    keybindings,
  });
  return mergeWithKeybindingDefaults(next);
};

export const resetKeybindings = async (): Promise<KeybindingsConfig> => {
  const next = await invoke<KeybindingsConfig>('reset_keybindings');
  return mergeWithKeybindingDefaults(next);
};
