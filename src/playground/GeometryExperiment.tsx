import { lazy, Suspense, useRef, useState, type PointerEvent } from "react";
import { SceneBoundary } from "@/components/ui/SceneBoundary";
import type { DragState, GeometryShape } from "@/three/PlaygroundGeometry";
import type { ExperimentProps } from "./types";

const PlaygroundGeometry = lazy(() => import("@/three/PlaygroundGeometry"));

const WebGLUnavailable = () => (
  <p className="meta grid h-full place-items-center px-6 text-center">This experiment needs WebGL, which isn't available in this browser.</p>
);

const SHAPES: ReadonlyArray<{ id: GeometryShape; label: string }> = [
  { id: "crystal", label: "Crystal" },
  { id: "knot", label: "Knot" },
  { id: "lattice", label: "Lattice" },
];
const DRAG_SENSITIVITY = 0.008;

export const GeometryExperiment = ({ active }: ExperimentProps) => {
  const [shape, setShape] = useState<GeometryShape>("crystal");
  const drag = useRef<DragState>({ rotationX: 0.3, rotationY: 0, velocityX: 0, velocityY: 0, isDragging: false });
  const lastPointer = useRef({ x: 0, y: 0 });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current.isDragging = true;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.isDragging) return;
    const dx = event.clientX - lastPointer.current.x;
    const dy = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    state.velocityY = dx * DRAG_SENSITIVITY;
    state.velocityX = dy * DRAG_SENSITIVITY;
    state.rotationY += state.velocityY;
    state.rotationX += state.velocityX;
  };

  const handlePointerUp = () => {
    drag.current.isDragging = false;
  };

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 touch-none"
        data-cursor="drag"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {active && (
          <SceneBoundary name="playground-geometry" fallback={<WebGLUnavailable />}>
            <Suspense fallback={null}>
              <PlaygroundGeometry active={active} shape={shape} drag={drag} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-line bg-ink/70 p-1 backdrop-blur" role="radiogroup" aria-label="Shape">
        {SHAPES.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={shape === option.id}
            onClick={() => setShape(option.id)}
            className={`rounded-full px-3 py-1 text-xs transition-colors duration-300 active:scale-95 ${
              shape === option.id ? "bg-hot text-ink" : "text-muted hover:text-paper"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
