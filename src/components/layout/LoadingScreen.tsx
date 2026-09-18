import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadingCopy, loadingTasks, loadingTiming } from "@/data/loading";
import { site } from "@/data/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp, damp } from "@/lib/math";
import { EASE } from "@/lib/motion";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLoading } from "@/providers/LoadingProvider";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";

const BOOT_ELEMENT_ID = "boot";
const BOOT_BAR_ID = "boot-bar";
const PROGRESS_SMOOTHING = 3.2;
/** Faster catch-up once everything has loaded, so the bar never lingers at 99%. */
const FINISH_SMOOTHING = 9;
/** Displayed progress counts as complete past this value, to avoid waiting on an asymptote. */
const COMPLETE_THRESHOLD = 0.995;
const COUNTER_DIGITS = 3;

/** Takes over from the static boot bar in index.html, continuing from wherever it had reached. */
const useAdoptBootScreen = (): number => {
  const [initialProgress] = useState(() => {
    const bar = document.getElementById(BOOT_BAR_ID);
    return bar ? clamp(bar.getBoundingClientRect().width / window.innerWidth, 0, 1) : 0;
  });
  useLayoutEffect(() => {
    document.getElementById(BOOT_ELEMENT_ID)?.remove();
  }, []);
  return initialProgress;
};

export const LoadingScreen = () => {
  const { phase, progress, completed, startedAt, beginExit, finish } = useLoading();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { lock, unlock } = useSmoothScroll();
  const initialProgress = useAdoptBootScreen();

  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const displayed = useRef(initialProgress);

  const isExiting = phase === "exiting";
  const minDuration = prefersReducedMotion ? loadingTiming.reducedMotionMinDurationMs : loadingTiming.minDurationMs;
  const nextTask = loadingTasks.find((task) => !completed.has(task.id));
  const statusLabel = nextTask?.label ?? loadingCopy.readyLabel;

  useEffect(() => {
    lock();
    return unlock;
  }, [lock, unlock]);

  useEffect(() => {
    if (isExiting) unlock(); // the page is usable as soon as it starts revealing
  }, [isExiting, unlock]);

  useEffect(() => {
    if (!isExiting) return;
    const timeout = window.setTimeout(finish, loadingTiming.exitTimeoutMs);
    return () => window.clearTimeout(timeout);
  }, [isExiting, finish]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") beginExit();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [beginExit]);

  useAnimationFrame((delta) => {
    // Never run ahead of real progress, and never finish before the minimum display time.
    const timeShare = clamp((performance.now() - startedAt) / minDuration, 0, 1);
    const target = Math.min(progress, timeShare);
    const rate = target >= 1 ? FINISH_SMOOTHING : PROGRESS_SMOOTHING;
    displayed.current += (target - displayed.current) * damp(rate, delta);
    if (target >= 1 && displayed.current >= COMPLETE_THRESHOLD) displayed.current = 1;

    if (barRef.current) barRef.current.style.transform = `scaleX(${displayed.current})`;
    if (counterRef.current) counterRef.current.textContent = String(Math.round(displayed.current * 100)).padStart(COUNTER_DIGITS, "0");
    if (displayed.current === 1) beginExit();
  }, phase === "loading");

  useGSAP(
    () => {
      if (!isExiting) return;
      // The butterfly lives in its own site-wide layer, so it simply keeps flying as this fades.
      const timeline = gsap.timeline({ defaults: { ease: EASE.outQuart }, onComplete: finish });
      timeline
        .to("[data-loader-ui]", { opacity: 0, y: -12, duration: 0.5, stagger: 0.04 }, 0)
        .to(barRef.current, { scaleX: 1, transformOrigin: "right center", duration: 0.3 }, 0)
        .to("[data-loader-backdrop]", { opacity: 0, duration: loadingTiming.backdropFadeSeconds, ease: EASE.inOut }, 0.1);
    },
    { scope: rootRef, dependencies: [isExiting] },
  );

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[90] ${isExiting ? "pointer-events-none" : ""}`}
      aria-busy={!isExiting}
    >
      <div data-loader-backdrop aria-hidden="true" className="absolute inset-0 bg-ink">
        <div className="grid-backdrop absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hot/10 blur-[140px]" />
      </div>

      <div className="container-frame relative flex h-full flex-col justify-between py-6 md:py-10">
        <div className="flex items-center justify-between">
          <span data-loader-ui className="font-display text-lg font-semibold">
            {site.initials} <span className="text-hot">✦</span>
          </span>
          <button
            data-loader-ui
            type="button"
            onClick={beginExit}
            className="link-underline meta text-muted transition-colors hover:text-paper focus-visible:text-paper"
            data-cursor="hover"
          >
            {loadingCopy.skipLabel}
          </button>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between gap-6">
            <p data-loader-ui className="meta flex items-center gap-2 text-muted" aria-live="polite">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-hot animate-blink" />
              {statusLabel}
            </p>
            <p data-loader-ui className="font-mono text-sm tabular-nums text-paper" aria-hidden="true">
              <span ref={counterRef}>{String(Math.round(initialProgress * 100)).padStart(COUNTER_DIGITS, "0")}</span>
              <span className="text-hot">%</span>
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={loadingCopy.srAnnouncement}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="relative h-px w-full overflow-hidden bg-line"
          >
            <span
              ref={barRef}
              className="absolute inset-0 origin-left bg-hot shadow-[0_0_12px_var(--color-hot)]"
              style={{ transform: `scaleX(${initialProgress})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
