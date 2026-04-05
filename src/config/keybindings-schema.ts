import { COMMAND_IDS, type CommandId } from './commands';

export type KeybindingCommandId = CommandId;
export type KeybindingsConfig = Record<KeybindingCommandId, string>;

const KEYBINDING_DEFAULT_VALUES = {
  [COMMAND_IDS.sidebarToggle]: 'cmd+b',
  [COMMAND_IDS.fileNew]: 'cmd+n',
  [COMMAND_IDS.searchFocus]: 'cmd+k',
  [COMMAND_IDS.undo]: 'cmd+z',
  [COMMAND_IDS.redo]: 'cmd+shift+z',
} satisfies KeybindingsConfig;

export const KEYBINDINGS_DEFAULTS = Object.freeze(KEYBINDING_DEFAULT_VALUES);

export const mergeWithKeybindingDefaults = (
  value: Partial<KeybindingsConfig> | undefined,
): KeybindingsConfig => {
  return {
    ...KEYBINDINGS_DEFAULTS,
    ...(value ?? {}),
  };
};
