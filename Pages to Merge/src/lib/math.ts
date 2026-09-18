export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;

/** Frame-rate independent smoothing factor for exponential lerp. */
export const damp = (smoothing: number, deltaSeconds: number): number => 1 - Math.exp(-smoothing * deltaSeconds);

/** Deterministic pseudo-random so decorative layouts stay stable across renders. */
export const seeded = (seed: number): (() => number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

export const padIndex = (index: number, length = 2): string => String(index).padStart(length, '0');
