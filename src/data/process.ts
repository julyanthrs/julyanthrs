import type { ProcessStage } from "./types";

export const processIntro = "How an idea becomes a shipped product.";

export const processStages: readonly ProcessStage[] = [
  { name: "Discover", detail: "Align on goals, constraints and what success looks like." },
  { name: "Research", detail: "Talk to users and study the data before deciding anything." },
  { name: "Ideate", detail: "Sketch many directions quickly, then narrow to the strongest." },
  { name: "Design", detail: "Build flows, systems and motion in high fidelity." },
  { name: "Build", detail: "Ship accessible, typed, tested production code." },
  { name: "Iterate", detail: "Measure, learn and refine after launch." },
];
