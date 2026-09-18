/**
 * Single shared pointer store. One passive listener feeds every effect
 * (cursor, parallax, 3D tilt) instead of dozens of per-component listeners.
 * Consumers read it inside the GSAP ticker, so nothing triggers React renders.
 */
export interface PointerState {
  /** Viewport pixels */
  x: number;
  y: number;
  /** Normalised -1..1 from viewport centre */
  nx: number;
  ny: number;
  hasMoved: boolean;
}

export const pointer: PointerState = { x: 0, y: 0, nx: 0, ny: 0, hasMoved: false };

let isTracking = false;

const handlePointerMove = (event: PointerEvent): void => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (event.clientY / window.innerHeight) * 2 - 1;
  pointer.hasMoved = true;
};

export const startPointerTracking = (): void => {
  if (isTracking || typeof window === 'undefined') return;
  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight / 2;
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  isTracking = true;
};
