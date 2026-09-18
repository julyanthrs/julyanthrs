import { useEffect, useRef, type RefObject } from "react";

export interface PointerSnapshot {
  /** Viewport-normalised position, -1 to 1 on each axis. */
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  /** performance.now() of the last movement or touch; 0 before the first one or after leaving the window. */
  lastMoveAt: number;
}

/** Window-level pointer tracking into a ref, for rAF-driven scenes that must not re-render. */
export const usePointerTracker = (): RefObject<PointerSnapshot> => {
  const pointer = useRef<PointerSnapshot>({ x: 0, y: 0, clientX: 0, clientY: 0, lastMoveAt: 0 });

  useEffect(() => {
    const record = (event: PointerEvent) => {
      const snapshot = pointer.current;
      snapshot.clientX = event.clientX;
      snapshot.clientY = event.clientY;
      snapshot.x = (event.clientX / window.innerWidth - 0.5) * 2;
      snapshot.y = (event.clientY / window.innerHeight - 0.5) * 2;
      snapshot.lastMoveAt = performance.now();
    };
    // Leaving the window means there is no cursor to follow.
    const handleOut = (event: MouseEvent) => {
      if (!event.relatedTarget) pointer.current.lastMoveAt = 0;
    };
    window.addEventListener("pointermove", record, { passive: true });
    window.addEventListener("pointerdown", record, { passive: true }); // taps on touch screens
    document.addEventListener("mouseout", handleOut);
    return () => {
      window.removeEventListener("pointermove", record);
      window.removeEventListener("pointerdown", record);
      document.removeEventListener("mouseout", handleOut);
    };
  }, []);

  return pointer;
};
