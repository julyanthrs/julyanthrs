import type { NavItem, SocialLink } from "./types";

export const site = {
  name: "Kai Moreno",
  initials: "KM",
  roles: ["Web Developer", "UI/UX Designer"],
  statement: "I design and build digital experiences that feel intuitive, expressive, and alive.",
  availability: "Open to new projects",
  location: "Remote, worldwide",
  email: import.meta.env.VITE_CONTACT_EMAIL || "hello@kaimoreno.dev",
  year: 2026,
  footerNote: "Designed and developed with curiosity.",
} as const;

export const navItems: readonly NavItem[] = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "playground", label: "Playground" },
  { id: "contact", label: "Contact" },
];

export const socialLinks: readonly SocialLink[] = [
  { label: "GitHub", handle: "@kaimoreno", href: "https://github.com/" },
  { label: "LinkedIn", handle: "in/kaimoreno", href: "https://www.linkedin.com/" },
  { label: "Dribbble", handle: "@kaimoreno", href: "https://dribbble.com/" },
  { label: "Behance", handle: "@kaimoreno", href: "https://www.behance.net/" },
];

export const about = {
  heading: "Designer who ships the code",
  body: "I work where interface design meets engineering. I sketch flows in Figma, then build them in React with the motion and detail intact, so nothing gets lost between mockup and production.",
  facts: [
    { label: "Years building", value: "5+" },
    { label: "Products shipped", value: "30" },
    { label: "Coffee per sprint", value: "∞" },
  ],
} as const;

export const marqueeWords = ["Design", "Development", "UI/UX", "Interaction", "Creative coding"] as const;
