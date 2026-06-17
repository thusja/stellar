import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UIStore {
  selectedStarId: number | null;
  focusStarId: number | null;
  recentSearchIds: number[];
  highlightedConstellation: string | null;
  isDetailSheetOpen: boolean;
  isDateSliderExpanded: boolean;
  isSettingsOpen: boolean;
  isNorthLocked: boolean;

  selectStar: (id: number | null) => void;
  setFocusStarId: (id: number | null) => void;
  pushRecentSearch: (id: number) => void;
  setHighlightedConstellation: (name: string | null) => void;
  openDetailSheet: () => void;
  closeDetailSheet: () => void;
  toggleDateSlider: () => void;
  setSettingsOpen: (value: boolean) => void;
  toggleNorthLock: () => void;
  setNorthLocked: (value: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      selectedStarId: null,
      focusStarId: null,
      recentSearchIds: [],
      highlightedConstellation: null,
      isDetailSheetOpen: false,
      isDateSliderExpanded: false,
      isSettingsOpen: false,
      isNorthLocked: false,

      selectStar: (id) =>
        set({ selectedStarId: id, isDetailSheetOpen: id !== null }),
      setFocusStarId: (id) => set({ focusStarId: id }),
      pushRecentSearch: (id) =>
        set((state) => ({ recentSearchIds: [id, ...state.recentSearchIds.filter((v) => v !== id)].slice(0, 3) })),
      setHighlightedConstellation: (name) => set({ highlightedConstellation: name }),

      openDetailSheet: () => set({ isDetailSheetOpen: true }),
      closeDetailSheet: () => set({ isDetailSheetOpen: false, selectedStarId: null }),
      toggleDateSlider: () =>
        set((state) => ({ isDateSliderExpanded: !state.isDateSliderExpanded })),
      setSettingsOpen: (value) => set({ isSettingsOpen: value }),
      toggleNorthLock: () => set((state) => ({ isNorthLocked: !state.isNorthLocked })),
      setNorthLocked: (value) => set({ isNorthLocked: value }),
    }),
    {
      name: 'stellar-ui-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentSearchIds: state.recentSearchIds,
        isNorthLocked: state.isNorthLocked,
        highlightedConstellation: state.highlightedConstellation,
      }),
    },
  ),
);
