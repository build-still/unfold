import { useConfigContext } from './config-context';

export const useConfig = () => {
  return useConfigContext();
};
