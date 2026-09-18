import { lazy, Suspense } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useLoading } from "@/providers/LoadingProvider";
import { SceneBoundary } from "@/components/ui/SceneBoundary";
import { loadCompanionScene } from "@/three/sceneModules";

const ButterflyCompanion = lazy(loadCompanionScene);

/**
 * Site-wide butterfly layer. It sits above the page and the loading screen but below the
 * custom cursor, and never receives pointer events.
 */
export const ButterflyLayer = () => {
  const { phase } = useLoading();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95]">
      <SceneBoundary name="companion" fallback={null}>
        <Suspense fallback={null}>
          <ButterflyCompanion intro={phase === "loading"} reducedMotion={prefersReducedMotion} />
        </Suspense>
      </SceneBoundary>
    </div>
  );
};
