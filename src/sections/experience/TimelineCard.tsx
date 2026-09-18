import type { ExperienceEntry } from "@/data/types";

export type NodeState = "upcoming" | "active" | "passed";

const CARD_STATE: Record<NodeState, string> = {
  upcoming: "opacity-40 translate-y-2",
  active: "opacity-100 border-hot/60 shadow-[0_20px_60px_-25px_rgb(255_46_136/0.6)]",
  passed: "opacity-75",
};

export const TimelineCard = ({ entry, state }: { entry: ExperienceEntry; state: NodeState }) => (
  <div
    className={`group/card rounded-xl border border-line bg-surface/85 p-4 backdrop-blur-sm transition-[opacity,transform,border-color,box-shadow] duration-700 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-hot/60 ${CARD_STATE[state]}`}
  >
    <p className={`font-mono text-xs transition-colors duration-500 ${state === "upcoming" ? "text-faint" : "text-hot"}`}>
      {entry.year}
    </p>
    <h3 className="mt-1 text-lg font-semibold leading-snug">{entry.role}</h3>
    <p className="text-sm text-blush">{entry.organization}</p>
    <p className="mt-2 text-sm leading-relaxed text-muted">{entry.summary}</p>
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
      {entry.tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-line px-2 py-0.5 text-[0.7rem] text-muted transition-colors duration-300 group-hover/card:border-line-hot"
        >
          {tag}
        </li>
      ))}
    </ul>
  </div>
);

const NODE_STATE: Record<NodeState, string> = {
  upcoming: "bg-surface border-faint scale-75",
  active: "bg-hot border-hot scale-125 shadow-[0_0_0_6px_rgb(255_46_136/0.18),0_0_24px_var(--color-hot)]",
  passed: "bg-blush border-blush scale-90",
};

export const TimelineNode = ({ state, className = "" }: { state: NodeState; className?: string }) => (
  <span
    aria-hidden="true"
    className={`block size-3.5 rounded-full border transition-[transform,background-color,box-shadow,border-color] duration-500 ease-[var(--ease-spring)] ${NODE_STATE[state]} ${className}`}
  />
);

export const getNodeState = (index: number, activeIndex: number): NodeState => {
  if (index === activeIndex) return "active";
  return index < activeIndex ? "passed" : "upcoming";
};
