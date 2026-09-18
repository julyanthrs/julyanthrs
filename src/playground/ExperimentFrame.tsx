import { useEffect, useRef, useState, type ComponentType } from "react";
import type { Experiment, ExperimentId } from "@/data/types";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import type { ExperimentProps } from "./types";

interface FrameShape {
  radius: string;
  notched: boolean;
}

/** Each frame gets its own silhouette so the grid feels curated rather than templated. */
const SHAPES: Record<ExperimentId, FrameShape> = {
  geometry: { radius: "rounded-[2rem]", notched: false },
  particles: { radius: "rounded-none", notched: true },
  liquid: { radius: "rounded-t-3xl rounded-b-[9rem]", notched: false },
  kinetic: { radius: "rounded-xl", notched: false },
  physics: { radius: "rounded-3xl", notched: false },
  distortion: { radius: "rounded-none", notched: false },
  magnetic: { radius: "rounded-[3rem]", notched: false },
  grid: { radius: "rounded-lg", notched: true },
};

const NOTCH_PX = 28;
const NOTCH_CLIP = `polygon(0 0, calc(100% - ${NOTCH_PX}px) 0, 100% ${NOTCH_PX}px, 100% 100%, 0 100%)`;

interface ExperimentFrameProps {
  experiment: Experiment;
  index: number;
  Component: ComponentType<ExperimentProps>;
}

export const ExperimentFrame = ({ experiment, index, Component }: ExperimentFrameProps) => {
  const frameRef = useRef<HTMLElement>(null);
  const isNearViewport = useInView(frameRef, { rootMargin: "200px 0px" });
  const isOnScreen = useInView(frameRef);
  const [hasMounted, setHasMounted] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const shape = SHAPES[experiment.id];

  useEffect(() => {
    if (isNearViewport) setHasMounted(true);
  }, [isNearViewport]);

  return (
    <article
      ref={frameRef}
      data-experiment
      aria-labelledby={`experiment-${experiment.id}`}
      className={`group/frame relative overflow-hidden border border-line bg-surface/70 transition-[border-color,box-shadow] duration-500 hover:border-hot/50 hover:shadow-[0_0_40px_-10px_rgb(255_46_136/0.45)] ${shape.radius} ${
        experiment.span === 2 ? "h-[340px] md:h-[380px]" : "h-[300px]"
      }`}
      style={shape.notched ? { clipPath: NOTCH_CLIP } : undefined}
    >
      {shape.notched && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 h-px origin-top-right bg-line transition-colors group-hover/frame:bg-hot/60"
          style={{ width: NOTCH_PX * Math.SQRT2, transform: "rotate(-45deg)" }}
        />
      )}

      <div className="absolute inset-0">{hasMounted && <Component active={isOnScreen && !prefersReducedMotion} />}</div>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-ink/80 to-transparent p-4 pr-10">
        <div>
          <p className="font-mono text-xs text-hot">{String(index + 1).padStart(2, "0")}</p>
          <h3 id={`experiment-${experiment.id}`} className="text-sm font-medium transition-transform duration-500 group-hover/frame:translate-x-1">
            {experiment.title}
          </h3>
        </div>
        <p className="meta text-right opacity-60 transition-opacity duration-500 group-hover/frame:text-blush group-hover/frame:opacity-100">
          {experiment.hint}
        </p>
      </header>
    </article>
  );
};
