import { create } from 'zustand';
import type { Profile } from './types';

interface AppState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
