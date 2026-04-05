import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { executeCommand } from './commands';
import {
  getKeybindings,
  resetKeybindings as resetKeybindingsOnDisk,
  setKeybindings as persistKeybindings,
} from './invoke';
import { keyboardEventToChord, normalizeChord } from './keybinding-utils';
import {
  KEYBINDINGS_DEFAULTS,
  mergeWithKeybindingDefaults,
  type KeybindingCommandId,
  type KeybindingsConfig,
} from './keybindings-schema';

const KEYBINDINGS_QUERY_KEY = ['settings', 'keybindings'] as const;

type KeybindingsContextValue = {
  keybindings: KeybindingsConfig;
  updateKeybinding: (
    commandId: KeybindingCommandId,
    chord: string,
  ) => Promise<KeybindingsConfig>;
  resetKeybindings: () => Promise<KeybindingsConfig>;
};

const KeybindingsContext = React.createContext<KeybindingsContextValue | null>(
  null,
);

export const KeybindingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = useQueryClient();

  const { data: keybindings = KEYBINDINGS_DEFAULTS } = useQuery({
    queryKey: KEYBINDINGS_QUERY_KEY,
    queryFn: getKeybindings,
    initialData: KEYBINDINGS_DEFAULTS,
  });

  React.useEffect(() => {
    const chordToCommandId = new Map<string, KeybindingCommandId>();

    (Object.entries(keybindings) as [KeybindingCommandId, string][]).forEach(
      ([commandId, chord]) => {
        const normalizedChord = normalizeChord(chord);
        if (normalizedChord) {
          chordToCommandId.set(normalizedChord, commandId);
        }
      },
    );

    const onKeyDown = (event: KeyboardEvent) => {
      const chord = keyboardEventToChord(event);
      if (!chord) {
        return;
      }

      const commandId = chordToCommandId.get(chord);
      if (!commandId) {
        return;
      }

      event.preventDefault();
      executeCommand(commandId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [keybindings]);

  const updateKeybinding = async (
    commandId: KeybindingCommandId,
    chord: string,
  ) => {
    const previous =
      queryClient.getQueryData<KeybindingsConfig>(KEYBINDINGS_QUERY_KEY) ??
      KEYBINDINGS_DEFAULTS;

    const normalizedChord = normalizeChord(chord);

    const next = mergeWithKeybindingDefaults({
      ...previous,
      [commandId]: normalizedChord || previous[commandId],
    });

    queryClient.setQueryData(KEYBINDINGS_QUERY_KEY, next);

    try {
      const persisted = await persistKeybindings(next);
      queryClient.setQueryData(KEYBINDINGS_QUERY_KEY, persisted);
      return persisted;
    } catch (error) {
      queryClient.setQueryData(KEYBINDINGS_QUERY_KEY, previous);
      throw error;
    }
  };

  const handleResetKeybindings = async () => {
    const restored = await resetKeybindingsOnDisk();
    queryClient.setQueryData(KEYBINDINGS_QUERY_KEY, restored);
    return restored;
  };

  const value: KeybindingsContextValue = {
    keybindings,
    updateKeybinding,
    resetKeybindings: handleResetKeybindings,
  };

  return (
    <KeybindingsContext.Provider value={value}>
      {children}
    </KeybindingsContext.Provider>
  );
};

export const useKeybindingsContext = () => {
  const context = React.useContext(KeybindingsContext);
  if (!context) {
    throw new Error(
      'useKeybindingsContext must be used within KeybindingsProvider.',
    );
  }

  return context;
};
