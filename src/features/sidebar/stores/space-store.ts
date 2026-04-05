import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SpaceStore = {
  currentSpaceId: string | null;
  setCurrentSpaceID: (spaceId: string) => void;
};

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set) => ({
      currentSpaceId: null,
      setCurrentSpaceID: (spaceId) => set({ currentSpaceId: spaceId }),
    }),
    {
      name: 'space-store',
      partialize: (state) => ({ currentSpaceId: state.currentSpaceId }),
    },
  ),
);
