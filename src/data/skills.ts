import type { Skill } from "./types";

export const skillsIntro = "Tools I reach for daily. Click one to see how I use it.";

export const skills: readonly Skill[] = [
  { name: "React", group: "build", detail: "Component architecture, hooks, suspense and performance profiling." },
  { name: "TypeScript", group: "build", detail: "Strict types that document intent and catch bugs before review." },
  { name: "JavaScript", group: "build", detail: "Browser APIs, async patterns and framework-free interactions." },
  { name: "HTML", group: "build", detail: "Semantic, accessible markup as the foundation of every interface." },
  { name: "CSS", group: "build", detail: "Layout systems, custom properties and container queries." },
  { name: "Tailwind", group: "build", detail: "Token-driven utility styling that scales across teams." },
  { name: "Git", group: "build", detail: "Small commits, clear history and review-friendly branches." },
  { name: "Figma", group: "design", detail: "Wireframes, prototypes, UI systems and interaction design." },
  { name: "UI Design", group: "design", detail: "Hierarchy, rhythm and typography that make screens easy to scan." },
  { name: "UX Research", group: "design", detail: "Interviews, usability tests and turning findings into decisions." },
  { name: "Wireframing", group: "design", detail: "Fast low-fidelity layouts to agree on structure before pixels." },
  { name: "Prototyping", group: "design", detail: "Clickable flows that test ideas with real people early." },
  { name: "Three.js", group: "motion", detail: "Real-time 3D scenes, shaders and lightweight geometry." },
  { name: "GSAP", group: "motion", detail: "Scroll-driven timelines and choreographed interface motion." },
];
