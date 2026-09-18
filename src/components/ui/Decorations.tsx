import { useEffect, useRef } from "react";

export const CrossMark = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 10 10" className={`size-2.5 text-hot/70 ${className}`}>
    <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1" />
  </svg>
);

/** Four corner handles, like a selected layer in a design tool. */
export const SelectionHandles = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
    {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((position) => (
      <span key={position} className={`absolute size-2 border border-hot bg-ink ${position}`} />
    ))}
  </span>
);

export const InterfaceLabel = ({ children, className = "" }: { children: string; className?: string }) => (
  <span aria-hidden="true" className={`meta pointer-events-none select-none text-faint ${className}`}>
    {children}
  </span>
);

/** Live pointer coordinates written straight to the DOM (no re-renders). */
export const CoordinateReadout = ({ className = "" }: { className?: string }) => {
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frameId = 0;
    const handleMove = (event: PointerEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (xRef.current) xRef.current.textContent = String(Math.round(event.clientX)).padStart(4, "0");
        if (yRef.current) yRef.current.textContent = String(Math.round(event.clientY)).padStart(4, "0");
      });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handleMove);
    };
  }, []);

  return (
    <span aria-hidden="true" className={`meta pointer-events-none select-none tabular-nums ${className}`}>
      x: <span ref={xRef} className="text-blush">0302</span> y: <span ref={yRef} className="text-blush">0185</span>
    </span>
  );
};

interface SectionIndexProps {
  index: number;
  label: string;
  className?: string;
}

/** Sequence marker for the eight sections of the page. */
export const SectionIndex = ({ index, label, className = "" }: SectionIndexProps) => (
  <p className={`meta flex items-center gap-3 ${className}`}>
    <span className="text-hot">({String(index).padStart(2, "0")})</span>
    <span className="h-px w-8 bg-line-hot" aria-hidden="true" />
    <span>{label}</span>
  </p>
);
