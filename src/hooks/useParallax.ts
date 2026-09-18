import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePrefersReducedMotion } from "./useMediaQuery";

const TRAVEL_PX = 140;

/**
 * Scroll parallax for every `[data-speed]` element inside `scope`.
 * speed < 1 lags behind the scroll (background), speed > 1 leads it (foreground).
 * Put data-speed on wrappers only, so it never fights other transform animations.
 */
export const useParallax = (scope: RefObject<HTMLElement | null>): void => {
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion || !scope.current) return;
      scope.current.querySelectorAll<HTMLElement>("[data-speed]").forEach((element) => {
        const speed = Number.parseFloat(element.dataset.speed ?? "1");
        if (!Number.isFinite(speed) || speed === 1) return;
        const travel = (1 - speed) * TRAVEL_PX;
        gsap.fromTo(
          element,
          { y: -travel },
          {
            y: travel,
            ease: "none",
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope, dependencies: [prefersReducedMotion] },
  );
};
