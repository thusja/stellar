import { create } from 'zustand';
import { ObserverLocation } from '../types';

const DEFAULT_LOCATION: ObserverLocation = {
  latitude: 37.5665,
  longitude: 126.978,
  label: '서울 (기본값)',
};

interface ObserverStore {
  latitude: number;
  longitude: number;
  locationLabel: string;
  isDefaultLocation: boolean;
  observationDate: Date;

  setLocation: (lat: number, lng: number, label: string) => void;
  setDefaultLocation: () => void;
  setObservationDate: (date: Date) => void;
}

export const useObserverStore = create<ObserverStore>((set) => ({
  latitude: DEFAULT_LOCATION.latitude,
  longitude: DEFAULT_LOCATION.longitude,
  locationLabel: DEFAULT_LOCATION.label,
  isDefaultLocation: true,
  observationDate: new Date(),

  setLocation: (lat, lng, label) =>
    set({ latitude: lat, longitude: lng, locationLabel: label, isDefaultLocation: false }),

  setDefaultLocation: () =>
    set({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      locationLabel: DEFAULT_LOCATION.label,
      isDefaultLocation: true,
    }),

  setObservationDate: (date) => set({ observationDate: date }),
}));
