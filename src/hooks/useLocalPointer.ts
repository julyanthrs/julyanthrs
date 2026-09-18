import { useEffect, useRef, type RefObject } from "react";

export interface LocalPointer {
  x: number;
  y: number;
  /** Pointer velocity in px/frame-ish units, smoothed by callers as needed. */
  vx: number;
  vy: number;
  inside: boolean;
  pressed: boolean;
}

/**
 * Tracks the pointer relative to an element in a mutable ref.
 * Updates never trigger React renders, which keeps rAF-driven experiments cheap.
 */
export const useLocalPointer = (ref: RefObject<HTMLElement | null>): RefObject<LocalPointer> => {
  const pointer = useRef<LocalPointer>({ x: -9999, y: -9999, vx: 0, vy: 0, inside: false, pressed: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const state = pointer.current;
      if (state.inside) {
        state.vx = x - state.x;
        state.vy = y - state.y;
      }
      state.x = x;
      state.y = y;
      state.inside = true;
    };
    const leave = () => {
      pointer.current.inside = false;
      pointer.current.pressed = false;
      pointer.current.vx = 0;
      pointer.current.vy = 0;
    };
    const down = (event: PointerEvent) => {
      update(event);
      pointer.current.pressed = true;
    };
    const up = () => {
      pointer.current.pressed = false;
    };

    element.addEventListener("pointermove", update);
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointerleave", leave);
    window.addEventListener("pointerup", up);
    return () => {
      element.removeEventListener("pointermove", update);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerup", up);
    };
  }, [ref]);

  return pointer;
};
