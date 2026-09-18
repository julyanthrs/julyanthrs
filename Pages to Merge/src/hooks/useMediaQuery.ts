import { useCallback, useSyncExternalStore } from 'react';
import { MEDIA } from '@/lib/motion';

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
};

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

const LOW_POWER_CORES = 4;
const LOW_POWER_MEMORY_GB = 4;

/** Heuristic, evaluated once: weaker devices get lighter 3D and fewer particles. */
const detectLowPower = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as NavigatorWithMemory;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= LOW_POWER_CORES;
  const lowMemory = (nav.deviceMemory ?? 8) <= LOW_POWER_MEMORY_GB;
  return fewCores || lowMemory;
};

const IS_LOW_POWER = detectLowPower();

export interface MotionPreferences {
  reducedMotion: boolean;
  finePointer: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  lowPower: boolean;
}

export const useMotionPreferences = (): MotionPreferences => {
  const reducedMotion = useMediaQuery(MEDIA.reducedMotion);
  const finePointer = useMediaQuery(MEDIA.finePointer);
  const isTablet = useMediaQuery(MEDIA.tablet);
  const isDesktop = useMediaQuery(MEDIA.desktop);
  return { reducedMotion, finePointer, isTablet, isDesktop, lowPower: IS_LOW_POWER || reducedMotion };
};
