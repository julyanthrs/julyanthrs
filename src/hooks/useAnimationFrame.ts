import { useEffect, useRef } from "react";

export type FrameCallback = (deltaSeconds: number, elapsedSeconds: number) => void;

const MAX_DELTA_SECONDS = 1 / 20;

/**
 * Runs `callback` every animation frame while `active` is true and the tab is visible.
 * The latest callback is read through a ref, so callers don't need to memoize it.
 */
export const useAnimationFrame = (callback: FrameCallback, active: boolean): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let frameId = 0;
    let previous = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, MAX_DELTA_SECONDS);
      previous = now;
      elapsed += delta;
      callbackRef.current(delta, elapsed);
      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frameId);
      previous = performance.now();
      frameId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frameId);
      else start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [active]);
};
