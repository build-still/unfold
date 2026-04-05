import * as React from 'react';

export const COMMAND_IDS = {
  sidebarToggle: 'sidebar.toggle',
  fileNew: 'file.new',
  searchFocus: 'search.focus',
  undo: 'edit.undo',
  redo: 'edit.redo',
} as const;

export type CommandId = (typeof COMMAND_IDS)[keyof typeof COMMAND_IDS];
type CommandHandler = () => void;

const commandHandlers = new Map<CommandId, CommandHandler>();

export const registerCommand = (id: CommandId, handler: CommandHandler) => {
  commandHandlers.set(id, handler);

  return () => {
    if (commandHandlers.get(id) === handler) {
      commandHandlers.delete(id);
    }
  };
};

export const executeCommand = (id: CommandId) => {
  const handler = commandHandlers.get(id);
  if (!handler) {
    return false;
  }

  handler();
  return true;
};

export const useRegisterCommand = (id: CommandId, handler: CommandHandler) => {
  React.useEffect(() => {
    return registerCommand(id, handler);
  }, [id, handler]);
};
