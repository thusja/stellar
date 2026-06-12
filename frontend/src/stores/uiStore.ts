import { create } from 'zustand';

interface UIStore {
  selectedStarId: number | null;
  isDetailSheetOpen: boolean;
  isDateSliderExpanded: boolean;
  isSettingsOpen: boolean;

  selectStar: (id: number | null) => void;
  openDetailSheet: () => void;
  closeDetailSheet: () => void;
  toggleDateSlider: () => void;
  setSettingsOpen: (value: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedStarId: null,
  isDetailSheetOpen: false,
  isDateSliderExpanded: false,
  isSettingsOpen: false,

  selectStar: (id) =>
    set({ selectedStarId: id, isDetailSheetOpen: id !== null }),

  openDetailSheet: () => set({ isDetailSheetOpen: true }),
  closeDetailSheet: () => set({ isDetailSheetOpen: false, selectedStarId: null }),
  toggleDateSlider: () =>
    set((state) => ({ isDateSliderExpanded: !state.isDateSliderExpanded })),
  setSettingsOpen: (value) => set({ isSettingsOpen: value }),
}));
