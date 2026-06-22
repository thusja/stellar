import { create } from 'zustand';
import { StarPoint, ConstellationLine } from '../types';
import { BRIGHT_STARS } from '../data/brightStars';
import { CONSTELLATION_LINES } from '../data/constellationLines';
import { calcAltAz } from '../utils/starUtils';

const SPHERE_RADIUS = 5;
const STAR_CALC_CHUNK_SIZE = 400;
const STAR_CALC_DEBOUNCE_MS = 120;

let starCalculationSeq = 0;

function altAz3D(
  altitudeDeg: number,
  azimuthDeg: number,
  radius: number,
): { x: number; y: number; z: number } {
  const alt = (altitudeDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;

  return {
    x: radius * Math.cos(alt) * Math.sin(az),
    y: radius * Math.sin(alt),
    z: -radius * Math.cos(alt) * Math.cos(az),
  };
}

interface StarStore {
  stars: StarPoint[];
  constellationLines: ConstellationLine[];
  isCalculating: boolean;
  lastCalculationMs: number;
  calculationDebounceMs: number;
  magnitudeFilter: number;
  showConstellationLines: boolean;
  showBelowHorizon: boolean;
  showBelowHorizonLines: boolean;

  setStars: (stars: StarPoint[]) => void;
  setConstellationLines: (lines: ConstellationLine[]) => void;
  setIsCalculating: (value: boolean) => void;
  calculateStars: (lat: number, lng: number, date: Date) => void;
  setMagnitudeFilter: (mag: number) => void;
  toggleConstellationLines: () => void;
  toggleShowBelowHorizon: () => void;
  toggleShowBelowHorizonLines: () => void;
}

export const useStarStore = create<StarStore>((set, get) => ({
  stars: [],
  constellationLines: CONSTELLATION_LINES,
  isCalculating: false,
  lastCalculationMs: 0,
  calculationDebounceMs: STAR_CALC_DEBOUNCE_MS,
  magnitudeFilter: 4.0,
  showConstellationLines: true,
  showBelowHorizon: false,
  showBelowHorizonLines: false,

  setStars: (stars) => set({ stars }),
  setConstellationLines: (lines) => set({ constellationLines: lines }),
  setIsCalculating: (value) => set({ isCalculating: value }),
  calculateStars: (lat, lng, date) => {
    const startedAt = Date.now();
    const seq = ++starCalculationSeq;
    set({ isCalculating: true });

    const { magnitudeFilter, showBelowHorizon, lastCalculationMs } = get();
    const source = BRIGHT_STARS.filter((star) => star.magnitude <= magnitudeFilter);
    let chunkSize = source.length > 5000 ? 280 : source.length > 2000 ? 360 : STAR_CALC_CHUNK_SIZE;
    if (lastCalculationMs > 140) chunkSize = Math.max(180, chunkSize - 80);
    if (lastCalculationMs < 45) chunkSize = Math.min(900, chunkSize + 120);

    const stars: StarPoint[] = [];
    let index = 0;

    const runChunk = () => {
      if (seq !== starCalculationSeq) return;

      const end = Math.min(index + chunkSize, source.length);
      for (let i = index; i < end; i += 1) {
        const star = source[i];
        const { altitude, azimuth } = calcAltAz(star.ra, star.dec, lat, lng, date);
        if (!showBelowHorizon && altitude < 0) continue;

        const pos = altAz3D(altitude, azimuth, SPHERE_RADIUS);
        stars.push({
          ...star,
          altitude,
          azimuth,
          x: pos.x,
          y: pos.y,
          z: pos.z,
        });
      }

      index = end;
      if (index < source.length) {
        setTimeout(runChunk, 0);
        return;
      }

      if (seq !== starCalculationSeq) return;
      const elapsedMs = Date.now() - startedAt;
      let nextDebounceMs = source.length > 5000 ? 150 : source.length > 2000 ? 120 : 90;
      if (elapsedMs > 160) nextDebounceMs = Math.min(260, nextDebounceMs + 70);
      if (elapsedMs < 50) nextDebounceMs = Math.max(50, nextDebounceMs - 20);

      set({
        stars,
        constellationLines: CONSTELLATION_LINES,
        isCalculating: false,
        lastCalculationMs: elapsedMs,
        calculationDebounceMs: nextDebounceMs,
      });
    };

    runChunk();
  },
  setMagnitudeFilter: (mag) => set({ magnitudeFilter: mag }),
  toggleConstellationLines: () =>
    set((state) => ({ showConstellationLines: !state.showConstellationLines })),
  toggleShowBelowHorizon: () =>
    set((state) => ({ showBelowHorizon: !state.showBelowHorizon })),
  toggleShowBelowHorizonLines: () =>
    set((state) => ({ showBelowHorizonLines: !state.showBelowHorizonLines })),
}));
