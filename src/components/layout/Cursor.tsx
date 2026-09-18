import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useHasFinePointer } from "@/hooks/useMediaQuery";

type CursorMode = "default" | "hover" | "view" | "drag" | "play";

const LABELS: Record<CursorMode, string> = { default: "", hover: "", view: "View", drag: "Drag", play: "Play" };
const RING_SCALE: Record<CursorMode, number> = { default: 1, hover: 1.6, view: 2.6, drag: 2.3, play: 2.3 };

const isCursorMode = (value: string | undefined): value is CursorMode =>
  value !== undefined && value in LABELS;

/**
 * Pink dot plus a lagging ring. Elements opt into states with `data-cursor`,
 * read through one delegated listener so hovering never re-renders React.
 */
export const Cursor = () => {
  const hasFinePointer = useHasFinePointer();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!hasFinePointer || !dot || !ring || !label) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
    let currentMode: CursorMode = "default";
    let isVisible = false;

    const setMode = (mode: CursorMode) => {
      if (mode === currentMode) return;
      currentMode = mode;
      label.textContent = LABELS[mode];
      const hasLabel = LABELS[mode] !== "";
      gsap.to(ring, {
        scale: RING_SCALE[mode],
        backgroundColor: hasLabel ? "rgba(255,46,136,0.92)" : "rgba(255,46,136,0)",
        borderColor: hasLabel ? "rgba(255,46,136,0)" : "rgba(255,184,213,0.55)",
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.to(label, { opacity: hasLabel ? 1 : 0, scale: hasLabel ? 1 / RING_SCALE[mode] : 0.5, duration: 0.3 });
      gsap.to(dot, { scale: mode === "default" ? 1 : 0, duration: 0.25 });
    };

    const handleMove = (event: PointerEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.set([dot, ring], { x: event.clientX, y: event.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const handleOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button, input, textarea, select");
      if (!target) return setMode("default");
      const requested = target.dataset.cursor;
      setMode(isCursorMode(requested) ? requested : "hover");
    };

    const handleLeaveWindow = () => {
      isVisible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
    };
    const handleDown = () => gsap.to(ring, { scale: RING_SCALE[currentMode] * 0.8, duration: 0.2 });
    const handleUp = () => gsap.to(ring, { scale: RING_SCALE[currentMode], duration: 0.5, ease: "elastic.out(1,0.4)" });

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerover", handleOver);
    document.documentElement.addEventListener("pointerleave", handleLeaveWindow);
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.documentElement.removeEventListener("pointerleave", handleLeaveWindow);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [hasFinePointer]);

  if (!hasFinePointer) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <div
        ref={ringRef}
        className="fixed left-0 top-0 grid size-9 place-items-center rounded-full border border-blush/55 will-transform"
      >
        <span ref={labelRef} className="text-[0.55rem] font-semibold text-ink opacity-0" />
      </div>
      <div ref={dotRef} className="fixed left-0 top-0 size-1.5 rounded-full bg-hot will-transform" />
    </div>
  );
};
