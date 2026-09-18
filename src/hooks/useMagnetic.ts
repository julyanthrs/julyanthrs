import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

interface MagneticOptions {
  /** Fraction of pointer offset applied to the element. */
  strength?: number;
  /** Extra hit radius around the element, in px, where attraction starts. */
  radius?: number;
  enabled?: boolean;
}

/**
 * Pulls an element toward the pointer when it comes close, then springs it back.
 * Uses a window listener so attraction begins before the pointer touches the element.
 */
export const useMagnetic = (
  ref: RefObject<HTMLElement | null>,
  { strength = 0.35, radius = 60, enabled = true }: MagneticOptions = {},
): void => {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || !window.matchMedia("(pointer: fine)").matches) return;

    const moveX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3.out" });
    const moveY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3.out" });
    let isAttracted = false;

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const withinX = Math.abs(dx) < rect.width / 2 + radius;
      const withinY = Math.abs(dy) < rect.height / 2 + radius;

      if (withinX && withinY) {
        isAttracted = true;
        moveX(dx * strength);
        moveY(dy * strength);
      } else if (isAttracted) {
        isAttracted = false;
        gsap.to(element, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
      }
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      gsap.killTweensOf(element);
      gsap.set(element, { x: 0, y: 0 });
    };
  }, [ref, strength, radius, enabled]);
};
