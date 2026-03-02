import {
  useFileSystemStore,
  type FileSystemState,
} from '@/store/hooks/use-filesystem-store';

export function useFileSystem(): FileSystemState {
  return useFileSystemStore();
}
