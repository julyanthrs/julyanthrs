import type { ReactNode } from "react";
import type { ProjectVisualKind } from "@/data/types";

/**
 * Coded UI compositions standing in for project screenshots.
 * Layers use translateZ so perspective tilt separates them in depth.
 */
const Layer = ({ z, className = "", children }: { z: number; className?: string; children?: ReactNode }) => (
  <div className={`absolute ${className}`} style={{ transform: `translateZ(${z}px)` }}>
    {children}
  </div>
);

const FinanceVisual = () => (
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#3a0a22,#000_65%)]">
    <Layer z={0} className="inset-y-[8%] left-[5%] flex w-[7%] flex-col items-center gap-3 rounded-xl border border-line bg-paper/[0.03] py-4">
      <span className="size-4 rounded-md bg-hot" />
      {[0, 1, 2, 3].map((item) => (
        <span key={item} className="size-3 rounded-full bg-paper/15" />
      ))}
    </Layer>
    <Layer z={10} className="left-[16%] right-[5%] top-[8%]">
      <p className="text-[clamp(0.5rem,1vw,0.7rem)] text-muted">Available to spend</p>
      <p className="text-[clamp(1.2rem,3.4vw,2.6rem)] font-semibold leading-none">€12,480.20</p>
    </Layer>
    <Layer z={20} className="bottom-[10%] left-[16%] right-[5%] h-[52%] rounded-xl border border-line bg-surface/80 p-[2%]">
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="finance-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff2e88" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff2e88" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 80 C30 70 50 40 80 50 S130 20 160 34 210 60 240 26 280 18 300 10 V100 H0Z" fill="url(#finance-area)" />
        <path d="M0 80 C30 70 50 40 80 50 S130 20 160 34 210 60 240 26 280 18 300 10" fill="none" stroke="#ff2e88" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </Layer>
    <Layer z={60} className="right-[8%] top-[30%] flex gap-2">
      {["EUR", "USD", "PHP"].map((currency, index) => (
        <span
          key={currency}
          className={`rounded-full px-2.5 py-1 font-mono text-[clamp(0.45rem,0.8vw,0.6rem)] ${
            index === 0 ? "bg-hot text-ink" : "border border-line bg-ink/80 text-muted"
          }`}
        >
          {currency}
        </span>
      ))}
    </Layer>
  </div>
);

const CommerceVisual = () => (
  <div className="absolute inset-0 bg-[#0a0508]">
    <Layer z={0} className="inset-0 flex items-center justify-center">
      <span className="select-none text-[clamp(3rem,13vw,10rem)] font-extrabold leading-none text-paper/[0.06] [font-variation-settings:'wdth'_75]">
        NOIR
      </span>
    </Layer>
    <Layer z={25} className="inset-x-[8%] bottom-[12%] top-[16%] grid grid-cols-3 gap-[3%]">
      {["from-hot to-hot-deep", "from-chrome to-faint", "from-blush to-hot"].map((gradient, index) => (
        <div key={gradient} className={`relative overflow-hidden rounded-lg bg-gradient-to-b ${gradient} ${index === 1 ? "-translate-y-[8%]" : ""}`}>
          <span className="absolute inset-x-[20%] bottom-0 top-[25%] rounded-t-full bg-ink/80" />
          <span className="absolute bottom-[6%] left-[8%] font-mono text-[clamp(0.4rem,0.8vw,0.6rem)] text-paper">
            Look 0{index + 1}
          </span>
        </div>
      ))}
    </Layer>
    <Layer z={70} className="right-[6%] top-[9%] rounded-full bg-paper px-3 py-1.5 text-[clamp(0.5rem,0.9vw,0.7rem)] font-medium text-ink">
      Drop 12 / €240
    </Layer>
  </div>
);

const MusicVisual = () => (
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#2b0618,#000_70%)]">
    <Layer z={10} className="inset-0 flex items-center justify-center">
      <div className="relative aspect-square h-[62%]">
        {Array.from({ length: 48 }, (_, index) => (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 w-[2%] origin-bottom rounded-full bg-hot"
            style={{
              height: `${18 + ((index * 37) % 23)}%`,
              transform: `translate(-50%, -100%) rotate(${(index / 48) * 360}deg) translateY(-62%)`,
              opacity: 0.35 + ((index * 13) % 10) / 16,
            }}
          />
        ))}
        <div className="absolute inset-[30%] grid place-items-center rounded-full border border-line bg-ink">
          <span className="ml-[8%] size-0 border-y-[0.5rem] border-l-[0.8rem] border-y-transparent border-l-paper" />
        </div>
      </div>
    </Layer>
    <Layer z={40} className="left-[6%] top-[10%]">
      <span className="rounded-full bg-hot px-2 py-0.5 font-mono text-[clamp(0.45rem,0.8vw,0.6rem)] text-ink">LIVE</span>
      <p className="mt-2 text-[clamp(0.7rem,1.6vw,1.2rem)] font-semibold">Night Transit</p>
      <p className="text-[clamp(0.5rem,0.9vw,0.7rem)] text-muted">1,204 listening</p>
    </Layer>
    <Layer z={70} className="bottom-[10%] right-[6%] flex -space-x-2">
      {["bg-blush", "bg-hot", "bg-chrome", "bg-hot-deep"].map((color) => (
        <span key={color} className={`size-[clamp(1rem,2.4vw,1.8rem)] rounded-full border-2 border-ink ${color}`} />
      ))}
    </Layer>
  </div>
);

const SystemVisual = () => (
  <div className="absolute inset-0 bg-surface">
    <Layer z={0} className="grid-backdrop inset-0 opacity-50" />
    <Layer z={15} className="left-[6%] top-[10%] grid w-[40%] grid-cols-4 gap-[6%]">
      {["bg-hot", "bg-hot-deep", "bg-blush", "bg-chrome", "bg-paper", "bg-faint", "bg-muted", "bg-ink border border-line"].map((swatch) => (
        <span key={swatch} className={`aspect-square rounded-md ${swatch}`} />
      ))}
    </Layer>
    <Layer z={35} className="bottom-[12%] left-[6%] flex flex-col gap-2">
      <span className="rounded-full bg-hot px-4 py-1.5 text-center text-[clamp(0.5rem,1vw,0.75rem)] font-medium text-ink">Primary</span>
      <span className="rounded-full border border-line-hot px-4 py-1.5 text-center text-[clamp(0.5rem,1vw,0.75rem)]">Secondary</span>
    </Layer>
    <Layer z={55} className="right-[6%] top-[12%] w-[40%] rounded-xl border border-line bg-ink/90 p-[4%]">
      {[1.6, 1.25, 1, 0.8].map((scale, index) => (
        <div key={scale} className="flex items-baseline justify-between border-b border-line py-[3%] last:border-0">
          <span className="font-semibold" style={{ fontSize: `clamp(0.4rem, ${scale}vw, ${scale}rem)` }}>
            Heading {index + 1}
          </span>
          <span className="font-mono text-[clamp(0.35rem,0.7vw,0.55rem)] text-muted">{scale}rem</span>
        </div>
      ))}
    </Layer>
  </div>
);

const VISUALS: Record<ProjectVisualKind, () => React.JSX.Element> = {
  finance: FinanceVisual,
  commerce: CommerceVisual,
  music: MusicVisual,
  system: SystemVisual,
};

export const ProjectVisual = ({ kind }: { kind: ProjectVisualKind }) => {
  const Visual = VISUALS[kind];
  return (
    <div className="preserve-3d relative h-full w-full">
      <Visual />
    </div>
  );
};
