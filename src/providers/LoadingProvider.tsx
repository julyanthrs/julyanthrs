import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { loadingTasks, loadingTiming, type LoadingTaskId } from "@/data/loading";
import { loadCompanionScene, loadHeroScene } from "@/three/sceneModules";
import { supportsWebGL } from "@/lib/webgl";

/** loading: intro visible · exiting: intro animating away, page revealing · done: intro unmounted. */
export type LoadingPhase = "loading" | "exiting" | "done";

interface LoadingContextValue {
  phase: LoadingPhase;
  /** Weighted share of completed tasks, 0 to 1. */
  progress: number;
  completed: ReadonlySet<LoadingTaskId>;
  startedAt: number;
  completeTask: (id: LoadingTaskId) => void;
  beginExit: () => void;
  finish: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

const TASK_WEIGHTS = new Map(loadingTasks.map((task) => [task.id, task.weight]));

const whenWindowLoaded = (): Promise<void> =>
  document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", () => resolve(), { once: true }));

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [phase, setPhase] = useState<LoadingPhase>("loading");
  const [completed, setCompleted] = useState<ReadonlySet<LoadingTaskId>>(() => new Set());
  const startedAt = useRef(performance.now()).current;

  const completeTask = useCallback((id: LoadingTaskId) => {
    setCompleted((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  const beginExit = useCallback(() => setPhase((current) => (current === "loading" ? "exiting" : current)), []);
  const finish = useCallback(() => setPhase("done"), []);

  useEffect(() => {
    let cancelled = false;
    // Every task settles on success *or* failure: a broken asset must never block the page.
    const settle = (id: LoadingTaskId) => () => {
      if (!cancelled) completeTask(id);
    };

    void whenWindowLoaded().then(settle("page"));
    void document.fonts.ready.then(settle("fonts"), settle("fonts"));

    if (supportsWebGL()) {
      // Both scenes share the Three.js chunk; the engine is ready once each has arrived.
      Promise.all([loadHeroScene(), loadCompanionScene()]).then(settle("engine"), () => {
        settle("engine")();
        settle("scene")();
      });
    } else {
      settle("engine")();
      settle("scene")();
    }

    const cap = window.setTimeout(() => {
      if (cancelled) return;
      loadingTasks.forEach((task) => completeTask(task.id));
    }, loadingTiming.maxDurationMs);

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [completeTask]);

  const progress = useMemo(() => [...completed].reduce((sum, id) => sum + (TASK_WEIGHTS.get(id) ?? 0), 0), [completed]);

  const value = useMemo(
    () => ({ phase, progress, completed, startedAt, completeTask, beginExit, finish }),
    [phase, progress, completed, startedAt, completeTask, beginExit, finish],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used inside LoadingProvider");
  return context;
};

/**
 * True once the page should play its entrance animations.
 * Defaults to true outside a LoadingProvider so components stay usable in isolation.
 */
export const useIsRevealed = (): boolean => {
  const context = useContext(LoadingContext);
  return context ? context.phase !== "loading" : true;
};
