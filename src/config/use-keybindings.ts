import { useKeybindingsContext } from './keybindings-context';

export const useKeybindings = () => {
  return useKeybindingsContext();
};
