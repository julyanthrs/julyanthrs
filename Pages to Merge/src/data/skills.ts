export type SkillKind = 'build' | 'design';

export interface Skill {
  name: string;
  kind: SkillKind;
  description: string;
}

export const SKILLS: readonly Skill[] = [
  { name: 'HTML', kind: 'build', description: 'Semantic, accessible markup that screen readers and search engines both understand.' },
  { name: 'CSS', kind: 'build', description: 'Layout systems, fluid type, container queries and motion that stays on the compositor.' },
  { name: 'JavaScript', kind: 'build', description: 'Interaction logic, creative coding and browser APIs without framework lock-in.' },
  { name: 'React', kind: 'build', description: 'Composable component architecture, render-aware state and animation-heavy UIs.' },
  { name: 'TypeScript', kind: 'build', description: 'Strict types that make design systems safe to scale across teams.' },
  { name: 'Figma', kind: 'design', description: 'Interface design, wireframes, prototypes and design systems.' },
  { name: 'UI Design', kind: 'design', description: 'Typography-led interfaces with clear hierarchy and a distinct point of view.' },
  { name: 'UX Research', kind: 'design', description: 'Interviews, usability tests and synthesis that turn opinions into evidence.' },
  {
    name: 'Prototyping',
    kind: 'design',
    description: 'High-fidelity, animated prototypes to test ideas before a line of production code.',
  },
  { name: 'Responsive Design', kind: 'design', description: 'Intentional compositions for every screen, not just stacked columns.' },
  { name: 'Git', kind: 'build', description: 'Small, reviewable commits and branching workflows that keep releases calm.' },
  {
    name: 'Frontend Development',
    kind: 'build',
    description: 'Shipping the whole front end: performance budgets, testing and accessibility.',
  },
];
