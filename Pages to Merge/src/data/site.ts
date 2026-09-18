import type { VisualVariant } from '@/visuals/types';

export const SITE = {
  name: 'Nova Reyes',
  initials: 'NR',
  role: 'Web developer & UI/UX designer',
  email: 'hello@novareyes.studio',
  location: 'Manila, PH',
  timezone: 'Asia/Manila',
  availability: 'Booking projects from November 2026',
} as const;

export interface NavItem {
  label: string;
  path: string;
  preview: VisualVariant;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', path: '/', preview: 'noir' },
  { label: 'Work', path: '/work', preview: 'ledger' },
  { label: 'About', path: '/about', preview: 'pocket' },
  { label: 'Playground', path: '/playground', preview: 'synapse' },
  { label: 'Contact', path: '/contact', preview: 'atelier' },
];

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'Email', href: `mailto:${SITE.email}`, handle: SITE.email },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/novareyes', handle: '/in/novareyes' },
  { label: 'GitHub', href: 'https://github.com/novareyes', handle: '@novareyes' },
  { label: 'Behance', href: 'https://www.behance.net/novareyes', handle: 'behance/novareyes' },
  { label: 'Dribbble', href: 'https://dribbble.com/novareyes', handle: 'dribbble/novareyes' },
];

export interface ProcessStage {
  name: string;
  summary: string;
  output: string;
}

export const PROCESS_STAGES: readonly ProcessStage[] = [
  { name: 'Research', summary: 'Interviews, analytics and competitor teardown until the real problem is obvious.', output: 'Insight map' },
  { name: 'Ideate', summary: 'Fast sketches and flows. Quantity first, taste second.', output: 'Flow sketches' },
  { name: 'Design', summary: 'Systems before screens: tokens, type scale, components, then layouts.', output: 'Design system' },
  { name: 'Prototype', summary: 'Clickable, animated prototypes tested with real people.', output: 'Test sessions' },
  { name: 'Develop', summary: 'Typed, accessible, performant front-end that matches the prototype.', output: 'Production code' },
  { name: 'Iterate', summary: 'Measure, listen, adjust. Launch is the midpoint.', output: 'Release notes' },
];

export const MARQUEE_WORDS = ['Design', 'Development', 'Interaction', 'Creative coding', 'UI/UX', 'Motion'];
