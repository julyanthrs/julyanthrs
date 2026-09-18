export type SectionId =
  | "home"
  | "about"
  | "work"
  | "experience"
  | "skills"
  | "process"
  | "playground"
  | "contact";

export interface NavItem {
  id: SectionId;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
}

export type ProjectLayout = "left" | "right" | "center" | "split";
export type ProjectVisualKind = "finance" | "commerce" | "music" | "system";

export interface Project {
  slug: string;
  title: string;
  discipline: string;
  summary: string;
  year: string;
  layout: ProjectLayout;
  visual: ProjectVisualKind;
  caseStudy: {
    role: string;
    challenge: string;
    approach: string;
    outcome: string;
    stack: readonly string[];
  };
}

export interface ExperienceEntry {
  year: string;
  role: string;
  organization: string;
  summary: string;
  tags: readonly string[];
}

export interface Skill {
  name: string;
  detail: string;
  group: "build" | "design" | "motion";
}

export interface ProcessStage {
  name: string;
  detail: string;
}

export type ExperimentId =
  | "geometry"
  | "particles"
  | "liquid"
  | "kinetic"
  | "physics"
  | "distortion"
  | "magnetic"
  | "grid";

export interface Experiment {
  id: ExperimentId;
  title: string;
  hint: string;
  span: 1 | 2;
}
