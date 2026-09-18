import type { ExperienceEntry } from "./types";

export const experienceIntro = "Places, projects, and roles that shaped how I design and build.";

export const experience: readonly ExperienceEntry[] = [
  {
    year: "2022",
    role: "Design Intern",
    organization: "Northwind Studio",
    summary: "Redrew icon sets and learned why spacing systems matter.",
    tags: ["Figma", "Illustration"],
  },
  {
    year: "2023",
    role: "Junior UI Designer",
    organization: "Brightpath Health",
    summary: "Designed patient booking flows used by 200k people.",
    tags: ["UI Design", "Usability tests"],
  },
  {
    year: "2024",
    role: "Frontend Developer",
    organization: "Orbit Commerce",
    summary: "Rebuilt the checkout in React and cut load time by 38%.",
    tags: ["React", "TypeScript", "Performance"],
  },
  {
    year: "2025",
    role: "UI/UX Designer",
    organization: "Signal Labs",
    summary: "Led research and interaction design for a live-data product.",
    tags: ["UX Research", "Prototyping", "Motion"],
  },
  {
    year: "2026",
    role: "Product Designer + Developer",
    organization: "Independent",
    summary: "Partnering with startups from first sketch to shipped product.",
    tags: ["Three.js", "GSAP", "Design systems"],
  },
];
