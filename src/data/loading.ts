export type LoadingTaskId = "fonts" | "engine" | "scene" | "page";

export interface LoadingTask {
  id: LoadingTaskId;
  /** Short status shown while this task is the next one outstanding. */
  label: string;
  /** Share of the progress bar this task represents; weights sum to 1. */
  weight: number;
}

/** Ordered by when each task usually settles, so the status line reads naturally. */
export const loadingTasks: readonly LoadingTask[] = [
  { id: "page", label: "Loading assets", weight: 0.2 },
  { id: "fonts", label: "Setting type", weight: 0.15 },
  { id: "engine", label: "Waking the 3D engine", weight: 0.4 },
  { id: "scene", label: "Building the scene", weight: 0.25 },
];

export const loadingCopy = {
  readyLabel: "Ready",
  skipLabel: "Skip intro",
  srAnnouncement: "Loading portfolio",
} as const;

export const loadingTiming = {
  /** Keeps the intro on screen long enough to register on fast connections. */
  minDurationMs: 1800,
  /** Shorter minimum when the visitor prefers reduced motion. */
  reducedMotionMinDurationMs: 500,
  /** Hard cap: never keep anyone waiting on a slow or failed asset. */
  maxDurationMs: 9000,
  /** Backdrop fade once loading completes (seconds). */
  backdropFadeSeconds: 0.9,
  /** Exit is forced complete after this long, even if the butterfly handoff stalls. */
  exitTimeoutMs: 3200,
} as const;
