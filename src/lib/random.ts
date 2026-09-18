/** Deterministic PRNG (Park–Miller) for stable procedural layouts. */
export const createRandom = (seed: number) => {
  let state = Math.max(1, Math.floor(seed)) % 2147483647;
  return (): number => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};
