import { useRef, useState } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";
import type { ExperimentProps } from "./types";

const MagnetField = ({ children, strength, radius }: { children: React.ReactNode; strength: number; radius: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useMagnetic(ref, { strength, radius });
  return (
    <div className="group relative grid place-items-center">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border border-dashed border-hot/0 transition-[border-color,scale] duration-500 group-hover:scale-100 group-hover:border-hot/40"
        style={{ width: `calc(100% + ${radius}px)`, height: `calc(100% + ${radius}px)`, scale: "0.8" }}
      />
      <div ref={ref} className="will-transform">
        {children}
      </div>
    </div>
  );
};

export const MagneticUI = (_props: ExperimentProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [pressCount, setPressCount] = useState(0);

  return (
    <div className="flex h-full w-full flex-wrap items-center justify-center gap-10 p-6">
      <MagnetField strength={0.45} radius={70}>
        <button
          type="button"
          onClick={() => setPressCount((count) => count + 1)}
          className="rounded-full bg-hot px-6 py-3 text-sm font-semibold text-ink transition-transform duration-200 active:scale-90"
        >
          Pressed {pressCount}×
        </button>
      </MagnetField>

      <MagnetField strength={0.6} radius={60}>
        <button
          type="button"
          aria-label="Rotate arrow"
          className="group/arrow grid size-14 place-items-center rounded-full border border-line-hot text-hot transition-colors hover:bg-hot hover:text-ink active:scale-90"
        >
          <span aria-hidden="true" className="text-xl transition-transform duration-500 group-hover/arrow:rotate-[225deg]">↗</span>
        </button>
      </MagnetField>

      <MagnetField strength={0.3} radius={60}>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          aria-label="Magnet toggle"
          onClick={() => setIsEnabled((enabled) => !enabled)}
          className={`relative h-8 w-14 rounded-full border transition-colors duration-300 ${isEnabled ? "border-hot bg-hot/20" : "border-line bg-surface"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 size-6 rounded-full transition-[left,background-color] duration-500 ease-[var(--ease-spring)] ${
              isEnabled ? "left-7 bg-hot" : "left-1 bg-faint"
            }`}
          />
        </button>
      </MagnetField>
    </div>
  );
};
