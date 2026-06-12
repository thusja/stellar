import { create } from 'zustand';
import { StarPoint, ConstellationLine } from '../types';

interface StarStore {
  stars: StarPoint[];
  constellationLines: ConstellationLine[];
  isCalculating: boolean;
  magnitudeFilter: number;
  showConstellationLines: boolean;

  setStars: (stars: StarPoint[]) => void;
  setConstellationLines: (lines: ConstellationLine[]) => void;
  setIsCalculating: (value: boolean) => void;
  setMagnitudeFilter: (mag: number) => void;
  toggleConstellationLines: () => void;
}

export const useStarStore = create<StarStore>((set) => ({
  stars: [],
  constellationLines: [],
  isCalculating: false,
  magnitudeFilter: 4.0,
  showConstellationLines: true,

  setStars: (stars) => set({ stars }),
  setConstellationLines: (lines) => set({ constellationLines: lines }),
  setIsCalculating: (value) => set({ isCalculating: value }),
  setMagnitudeFilter: (mag) => set({ magnitudeFilter: mag }),
  toggleConstellationLines: () =>
    set((state) => ({ showConstellationLines: !state.showConstellationLines })),
}));
