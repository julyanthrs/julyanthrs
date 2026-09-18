export type DeviceTier = "low" | "mid" | "high";

/**
 * Coarse capability estimate used to scale expensive effects
 * (particle counts, geometry detail, DPR) on weaker devices.
 */
export const getDeviceTier = (): DeviceTier => {
  if (typeof window === "undefined") return "mid";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

  if (cores <= 4 || memory <= 2) return "low";
  if (isSmallScreen || cores <= 6) return "mid";
  return "high";
};

export const TIER_SCALE: Record<DeviceTier, number> = { low: 0.45, mid: 0.7, high: 1 };
