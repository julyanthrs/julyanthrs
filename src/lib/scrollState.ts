/**
 * Mutable scroll telemetry shared by rAF-driven effects (marquee, hero, cursor).
 * Kept outside React so reading it every frame never causes re-renders.
 */
export const scrollState = {
  /** Signed velocity in px per frame, as reported by Lenis (or estimated natively). */
  velocity: 0,
  /** 1 when scrolling down, -1 when scrolling up. Persists after scrolling stops. */
  direction: 1 as 1 | -1,
  /** Whole-page progress from 0 to 1. */
  progress: 0,
  scrollY: 0,
};
