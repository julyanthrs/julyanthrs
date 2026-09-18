import { useCallback, useSyncExternalStore } from "react";
import { BREAKPOINT } from "@/lib/motion";

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
};

export const usePrefersReducedMotion = (): boolean => useMediaQuery(BREAKPOINT.reducedMotion);
export const useIsDesktop = (): boolean => useMediaQuery(BREAKPOINT.desktop);
export const useHasFinePointer = (): boolean => useMediaQuery(BREAKPOINT.finePointer);
