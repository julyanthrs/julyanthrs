import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

const MAX_OFFSET_PX = 18;

/**
 * Shifts every `[data-depth]` child of `scope` against the pointer.
 * Larger depth values move further, which reads as closer to the viewer.
 */
export const usePointerDepth = (scope: RefObject<HTMLElement | null>, enabled = true): void => {
  useEffect(() => {
    const root = scope.current;
    if (!root || !enabled || !window.matchMedia("(pointer: fine)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]")).map((element) => ({
      depth: Number.parseFloat(element.dataset.depth ?? "0"),
      x: gsap.quickTo(element, "x", { duration: 0.9, ease: "power3.out" }),
      y: gsap.quickTo(element, "y", { duration: 0.9, ease: "power3.out" }),
      rotate: gsap.quickTo(element, "rotationY", { duration: 0.9, ease: "power3.out" }),
    }));

    const handleMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      layers.forEach((layer) => {
        layer.x(-nx * MAX_OFFSET_PX * layer.depth);
        layer.y(-ny * MAX_OFFSET_PX * layer.depth);
        layer.rotate(nx * 6 * layer.depth);
      });
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [scope, enabled]);
};
