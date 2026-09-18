export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((clamp(value, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export const distance = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(ax - bx, ay - by);

/** Frame-rate independent damping factor for lerp-based smoothing. */
export const damp = (smoothing: number, deltaSeconds: number): number =>
  1 - Math.exp(-smoothing * deltaSeconds);
