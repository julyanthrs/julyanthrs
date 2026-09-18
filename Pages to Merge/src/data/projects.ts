import type { VisualVariant } from '@/visuals/types';

export interface Metric {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  disciplines: readonly string[];
  archiveLabel: string;
  year: number;
  visual: VisualVariant;
  accent: string;
  role: string;
  tools: readonly string[];
  timeline: string;
  overview: string;
  problem: { statement: string; detail: string };
  research: { method: string; findings: readonly string[] };
  wireframes: string;
  designSystem: { swatches: readonly Swatch[]; typeface: string; components: readonly string[] };
  finalUI: string;
  prototype: string;
  development: { summary: string; stack: readonly string[]; snippet: string };
  results: readonly Metric[];
  lessons: readonly string[];
}

export const PROJECTS: readonly Project[] = [
  {
    slug: 'vaultline',
    name: 'Vaultline',
    tagline: 'A banking app for freelancers whose income never arrives on the same day twice.',
    disciplines: ['UI/UX', 'Frontend'],
    archiveLabel: 'Design + Dev',
    year: 2026,
    visual: 'ledger',
    accent: '#FF2D95',
    role: 'Lead product designer & front-end engineer',
    tools: ['Figma', 'React', 'TypeScript', 'D3', 'Storybook'],
    timeline: '14 weeks',
    overview:
      'Vaultline helps independent workers smooth irregular income into a predictable monthly salary. I led the product from discovery to a production web app used by 18,000 freelancers in its first quarter.',
    problem: {
      statement: 'Freelancers were rich on Tuesday and broke by Friday.',
      detail:
        'Traditional banking apps show a balance, not a runway. People with uneven income had no way to see whether a big invoice would actually cover the next three months.',
    },
    research: {
      method: '22 interviews, a 400-person survey and six weeks of diary studies.',
      findings: [
        '71% kept a separate spreadsheet to forecast cash flow.',
        'Tax set-asides were the single biggest source of anxiety.',
        'Nobody trusted a forecast they could not adjust by hand.',
      ],
    },
    wireframes:
      'The runway chart went through 30 lo-fi variants. The winner put time on the horizontal axis and let people drag future invoices to test scenarios.',
    designSystem: {
      swatches: [
        { name: 'Vault', hex: '#0D0D0D' },
        { name: 'Signal', hex: '#FF2D95' },
        { name: 'Calm', hex: '#FFC1DC' },
        { name: 'Paper', hex: '#FFFFFF' },
      ],
      typeface: 'Archivo Narrow for numbers, Archivo for text',
      components: ['Runway chart', 'Invoice chip', 'Tax jar', 'Salary slider', 'Alert rail'],
    },
    finalUI:
      'A dark, calm interface where pink appears only when money needs attention. Every screen answers one question: how long am I covered?',
    prototype: 'An interactive prototype let testers drag invoices across the timeline and watch their runway react in real time.',
    development: {
      summary:
        'Built as a typed React app with a D3-powered chart layer, virtualised transaction lists and optimistic updates for scenario planning.',
      stack: ['React 18', 'TypeScript', 'D3', 'TanStack Query', 'Vitest'],
      snippet: `export const runwayMonths = (
  balance: Money,
  burn: Money,
  incoming: Invoice[],
): number => {
  const expected = incoming
    .filter((invoice) => invoice.confidence >= 0.6)
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  return Math.floor((balance + expected) / burn);
};`,
    },
    results: [
      { value: 18, suffix: 'k', label: 'Active freelancers in Q1' },
      { value: 42, suffix: '%', label: 'Fewer late tax payments' },
      { value: 4.8, decimals: 1, label: 'App Store rating' },
    ],
    lessons: [
      'Forecasts earn trust when people can argue with them.',
      'Colour is a budget: spend pink only where action is needed.',
      'Prototype the data, not just the screens.',
    ],
  },
  {
    slug: 'maison-ore',
    name: 'Maison Oré',
    tagline: 'An e-commerce flagship for a jewellery house that wanted the web to feel like its Paris atelier.',
    disciplines: ['Web development', 'Creative direction'],
    archiveLabel: 'Web',
    year: 2026,
    visual: 'atelier',
    accent: '#FF9FCC',
    role: 'Creative developer',
    tools: ['Next.js', 'Shopify Hydrogen', 'GSAP', 'Three.js', 'Figma'],
    timeline: '10 weeks',
    overview:
      'A headless storefront where product pages behave like vitrines. Pieces rotate under studio light, and the checkout stays as fast as a marketplace.',
    problem: {
      statement: 'Luxury looked cheap on a product grid.',
      detail:
        'The previous theme flattened handcrafted pieces into identical thumbnails. Conversion on mobile sat at 0.9% and the brand team hated every page.',
    },
    research: {
      method: 'In-store observation, session recordings and a card sort with 40 customers.',
      findings: [
        'Customers in the atelier touched an average of seven pieces before buying.',
        'Mobile shoppers abandoned at the size guide, not the price.',
        'Material close-ups drove more add-to-carts than lifestyle photos.',
      ],
    },
    wireframes: 'Wireframes explored a “tray” metaphor: pieces sit on a surface you can slide, pick up and compare side by side.',
    designSystem: {
      swatches: [
        { name: 'Velvet', hex: '#090909' },
        { name: 'Rosé', hex: '#FF9FCC' },
        { name: 'Blush', hex: '#FFC1DC' },
        { name: 'Pearl', hex: '#FFFFFF' },
      ],
      typeface: 'Instrument Serif with Archivo',
      components: ['Vitrine', 'Material zoom', 'Ring sizer', 'Compare tray', 'Quiet cart'],
    },
    finalUI:
      'Editorial product stories with oversized serif type, real-time 3D pieces and a checkout that removes every non-essential field.',
    prototype:
      'A motion prototype defined how pieces lift from the tray, how light follows the cursor and how the cart slides in without hiding the product.',
    development: {
      summary: '3D models are lazy-loaded per product with a static fallback, keeping Largest Contentful Paint under 1.8 seconds on 4G.',
      stack: ['Hydrogen', 'React', 'Three.js', 'GSAP', 'Cloudflare'],
      snippet: `const Vitrine = lazy(() => import('./VitrineScene'));

export function ProductStage({ product }: Props) {
  const canRender3D = useGpuTier() >= 2;
  return canRender3D ? (
    <Suspense fallback={<StillImage product={product} />}>
      <Vitrine model={product.model} />
    </Suspense>
  ) : <StillImage product={product} />;
}`,
    },
    results: [
      { value: 2.7, decimals: 1, suffix: '×', label: 'Mobile conversion rate' },
      { value: 1.8, decimals: 1, suffix: 's', label: 'LCP on 4G' },
      { value: 34, suffix: '%', label: 'Higher average order value' },
    ],
    lessons: [
      'Performance is part of luxury.',
      '3D needs a great still-image fallback, not a spinner.',
      'Shoppers want fewer choices shown more beautifully.',
    ],
  },
  {
    slug: 'cortex-studio',
    name: 'Cortex Studio',
    tagline: 'An AI workspace where research teams can see why a model reached its answer.',
    disciplines: ['Product design', 'Design systems'],
    archiveLabel: 'Product',
    year: 2025,
    visual: 'synapse',
    accent: '#FF4FA3',
    role: 'Senior product designer',
    tools: ['Figma', 'ProtoPie', 'React', 'Radix', 'Maze'],
    timeline: '6 months',
    overview:
      'Cortex Studio turns long model conversations into a visible map of sources, assumptions and branches, so teams can review AI output like they review code.',
    problem: {
      statement: 'Chat is a terrible shape for serious work.',
      detail: 'Analysts lost track of which answer came from which source. Reviews happened in screenshots pasted into slide decks.',
    },
    research: {
      method: 'Contextual inquiry with five research teams and a 3-week usability benchmark.',
      findings: [
        'Reviewers spent 40% of their time re-finding sources.',
        'Branching conversations were common but invisible.',
        'Teams wanted comments on reasoning, not only on final answers.',
      ],
    },
    wireframes: 'The core idea — a canvas of thought nodes beside a linear chat — survived from the first whiteboard sketch to launch.',
    designSystem: {
      swatches: [
        { name: 'Graphite', hex: '#0D0D0D' },
        { name: 'Neuron', hex: '#FF4FA3' },
        { name: 'Dendrite', hex: '#FF9FCC' },
        { name: 'Signal', hex: '#FFFFFF' },
      ],
      typeface: 'Archivo with JetBrains Mono for citations',
      components: ['Thought node', 'Source pill', 'Branch rail', 'Review thread', 'Confidence meter'],
    },
    finalUI: 'A split workspace: conversation on the left, reasoning canvas on the right. Hover any sentence and its sources light up.',
    prototype: 'ProtoPie prototypes tested branching, citation hover and review handoff with 32 analysts before engineering started.',
    development: {
      summary:
        'I built the component library in React with Radix primitives and wrote the canvas interaction spec used by the engineering team.',
      stack: ['React', 'Radix UI', 'Zustand', 'React Flow', 'Chromatic'],
      snippet: `export const sourcesFor = (sentenceId: string) =>
  useStore(
    (state) => state.citations[sentenceId] ?? EMPTY,
    shallow,
  );`,
    },
    results: [
      { value: 38, suffix: '%', label: 'Faster review cycles' },
      { value: 96, suffix: '%', label: 'Components with a11y tests' },
      { value: 12, label: 'Enterprise teams onboarded' },
    ],
    lessons: [
      'Make the invisible part of AI visible.',
      'A design system is a product with its own users.',
      'Benchmarks beat opinions in stakeholder reviews.',
    ],
  },
  {
    slug: 'noir-parade',
    name: 'Noir Parade',
    tagline: 'A brand website for a Manila music festival that refuses to look like a festival website.',
    disciplines: ['Design', 'Development'],
    archiveLabel: 'Design + Dev',
    year: 2025,
    visual: 'noir',
    accent: '#FF2D95',
    role: 'Designer & developer',
    tools: ['Figma', 'Astro', 'GSAP', 'WebGL', 'Sanity'],
    timeline: '8 weeks',
    overview:
      'An editorial, type-driven site for a late-night festival. The line-up reveals itself like a zine, and the ticket flow sold out in 19 minutes.',
    problem: {
      statement: 'Every festival site looks like the same poster.',
      detail:
        'The organisers wanted underground credibility and mainstream ticket sales, on a site that could survive a traffic spike of 60,000 visitors at launch.',
    },
    research: {
      method: 'Mood boarding with the artists, a fan survey and load-testing the previous year’s launch.',
      findings: [
        'Fans screenshot the line-up more than any other page.',
        '83% of ticket traffic came from mobile social links.',
        'The previous site crashed 4 minutes after launch.',
      ],
    },
    wireframes: 'Wireframes treated each page as a spread in a printed zine, with type as the primary image and photos as interruptions.',
    designSystem: {
      swatches: [
        { name: 'Midnight', hex: '#050505' },
        { name: 'Parade', hex: '#FF2D95' },
        { name: 'Neon', hex: '#FF4FA3' },
        { name: 'Flash', hex: '#FFFFFF' },
      ],
      typeface: 'Archivo at every width from 62 to 125',
      components: ['Line-up poster', 'Set timer', 'Stage map', 'Ticket drawer', 'Share card'],
    },
    finalUI:
      'Variable-width type that stretches with scroll speed, a shareable line-up generator and a ticket drawer that never leaves the page.',
    prototype: 'Motion studies in After Effects defined type behaviour, then moved straight into GSAP timelines reviewed on real phones.',
    development: {
      summary:
        'Static-first Astro pages served from the edge, with interactive islands only where they matter. The launch held at a 99.98% success rate.',
      stack: ['Astro', 'GSAP', 'OGL', 'Sanity', 'Vercel Edge'],
      snippet: `lenis.on('scroll', ({ velocity }) => {
  const width = gsap.utils.clamp(62, 125, 100 + velocity * 2);
  headline.style.fontVariationSettings = \`'wdth' \${width}\`;
});`,
    },
    results: [
      { value: 19, suffix: 'm', label: 'To sell out 12,000 tickets' },
      { value: 60, suffix: 'k', label: 'Concurrent visitors at launch' },
      { value: 99.98, decimals: 2, suffix: '%', label: 'Request success rate' },
    ],
    lessons: [
      'Constraints like one typeface can create the strongest identity.',
      'Design the share image before the page.',
      'Load-test the moment that matters most.',
    ],
  },
  {
    slug: 'halo-run',
    name: 'Halo Run',
    tagline: 'A running app that coaches with light and haptics so runners can keep their phone in the pocket.',
    disciplines: ['UI/UX design'],
    archiveLabel: 'UI/UX',
    year: 2024,
    visual: 'pocket',
    accent: '#FFC1DC',
    role: 'UI/UX designer',
    tools: ['Figma', 'Rive', 'SwiftUI previews', 'Lookback'],
    timeline: '12 weeks',
    overview:
      'Halo Run replaces glance-heavy dashboards with ambient cues: a glowing ring on the lock screen, haptic pace nudges and audio that only speaks when it matters.',
    problem: {
      statement: 'Runners were checking their phones every 90 seconds.',
      detail: 'Existing apps rewarded staring at numbers. It broke focus, caused stumbles and made the run feel like a spreadsheet.',
    },
    research: {
      method: 'Ride-along runs with 15 people, GoPro footage and heart-rate annotations.',
      findings: [
        'Pace was the only metric runners needed mid-run.',
        'Haptic patterns were recognised after two sessions.',
        'Post-run stories mattered more than live stats.',
      ],
    },
    wireframes: 'Wireframes started on paper strapped to an arm band, testing what could be understood in under half a second.',
    designSystem: {
      swatches: [
        { name: 'Night run', hex: '#090909' },
        { name: 'Halo', hex: '#FFC1DC' },
        { name: 'Pulse', hex: '#FF2D95' },
        { name: 'Chalk', hex: '#FFFFFF' },
      ],
      typeface: 'Archivo Condensed numerals',
      components: ['Halo ring', 'Pace haptic', 'Split card', 'Run story', 'Route glow'],
    },
    finalUI:
      'An almost empty in-run screen with a single breathing ring. After the run, a story recaps splits, route and effort in swipeable cards.',
    prototype: 'Rive animations drove the halo ring states, tested outdoors with a vibration harness synced to the prototype.',
    development: {
      summary: 'I delivered Rive state machines and a token package the iOS team consumed directly, removing hand-off guesswork.',
      stack: ['Rive', 'Figma tokens', 'Style Dictionary', 'SwiftUI'],
      snippet: `{
  "halo": {
    "ring": { "value": "{color.petal}", "type": "color" },
    "pulse": { "value": "620ms", "type": "duration" }
  }
}`,
    },
    results: [
      { value: 71, suffix: '%', label: 'Fewer mid-run phone checks' },
      { value: 3.1, decimals: 1, suffix: '×', label: 'Week-4 retention' },
      { value: 250, suffix: 'k', label: 'Runs recorded in beta' },
    ],
    lessons: [
      'The best interface is sometimes a feeling.',
      'Test in the real context, even if it means running.',
      'Shipping tokens beats shipping specs.',
    ],
  },
];

export const getProjectBySlug = (slug: string | undefined): Project | undefined => PROJECTS.find((project) => project.slug === slug);

export const getNextProject = (slug: string): Project => {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  return PROJECTS[(index + 1) % PROJECTS.length] as Project;
};

export interface LabEntry {
  year: number;
  name: string;
  label: string;
  visual: VisualVariant;
}

/** Smaller explorations listed in the archive; they live on the Playground page. */
export const LAB_ENTRIES: readonly LabEntry[] = [
  { year: 2025, name: 'Liquid Type Engine', label: 'Creative code', visual: 'noir' },
  { year: 2024, name: 'Particle Moodboards', label: 'Experiment', visual: 'synapse' },
  { year: 2024, name: 'Magnetic UI Kit', label: 'Open source', visual: 'pocket' },
];
