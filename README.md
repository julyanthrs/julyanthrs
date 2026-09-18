# Kai Moreno — Portfolio

A single-scroll creative portfolio for a web developer + UI/UX designer.
React 19, TypeScript (strict), Tailwind CSS v4, GSAP + ScrollTrigger, Lenis, Framer Motion and Three.js via React Three Fiber.

## Getting started

Requires Node 20+.

```bash
npm install
cp .env.example .env   # optional, see "Contact form"
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check, then a code-split production build in `dist/` (deploy this) |
| `npm run build:single` | Everything inlined into `dist-single/index.html`, for sharing a preview as one file |
| `npm run preview` | Serve `dist/` locally |
| `npm run typecheck` | `tsc` only |

`dist/` is a static site: deploy it to Vercel, Netlify, Cloudflare Pages or any static host.

## Editing content

All copy lives in `src/data/`, so most changes never touch a component.

| File | Controls |
| --- | --- |
| `site.ts` | Name, roles, statement, availability, nav items, social links, About copy, marquee words |
| `projects.ts` | Work showcase entries, their layout (`left` / `right` / `center` / `split`) and case-study text |
| `experience.ts` | Timeline entries |
| `skills.ts` | Skill capsules and their tooltip text |
| `process.ts` | Process stages |
| `playground.ts` | Experiment titles, hints and grid span |
| `contact.ts` | Contact headline, message, project types and field limits |

Project visuals are coded UI compositions (`src/components/visuals/ProjectVisual.tsx`), so the site ships with no image assets.
To use real screenshots instead, render an optimized `<img>` inside `ProjectShowcase`'s `data-mask-inner` child.

## Contact form

The form validates on the client (`src/lib/contact.ts`) and then either:

- **POSTs JSON** to `VITE_CONTACT_ENDPOINT` when it is set, with the body `{ name, email, projectType, message }` and a 10-second timeout; any non-2xx response is shown as an error; or
- **opens a prefilled email draft** addressed to `VITE_CONTACT_EMAIL` when no endpoint is configured.

Client validation is for user experience only. **Your endpoint must re-validate and rate-limit** every submission.
The hidden `company` field is a honeypot: submissions that fill it are dropped without sending.

## Architecture

```
src/
  data/          Typed content (single source of truth for copy)
  lib/           Framework-free helpers: math, motion tokens, device tier, contact validation
  hooks/         Reusable behaviours: parallax, magnetic, pointer depth, in-view, rAF loop
  providers/     SmoothScrollProvider (Lenis driven by the GSAP ticker)
  components/    Layout chrome (nav, cursor, progress, marquee, footer), UI primitives, visuals
  sections/      One folder or file per page section
  playground/    Experiment frame + the eight interactive experiments
  three/         R3F scenes and procedural geometry (lazy-loaded)
```

Conventions worth knowing before changing motion:

- **Parallax**: add `data-speed="0.8"` (lags) or `data-speed="1.1"` (leads) to a *wrapper* element inside a section that calls `useParallax`.
- **Pointer depth**: add `data-depth` to a wrapper inside a section that calls `usePointerDepth`.
- **Never animate `transform` from two sources on the same element.** Don't combine a GSAP tween, a CSS `transition-transform` or a CSS `animation` on one node; nest elements instead. A tween that reads a transitioning value settles on the wrong end state.
- Animation-frame loops (`useAnimationFrame`) and WebGL scenes pause when off-screen or when the tab is hidden.
- Scroll-driven values that don't need React (velocity, direction, progress) live in the mutable `scrollState` and are read inside rAF loops, avoiding re-renders.

## Loading screen and butterfly

On first paint a static boot bar (inline in `index.html`) appears, so there's never a blank screen. React's loading screen then takes over, tracking four real tasks in `src/data/loading.ts`: page load, fonts, the 3D engine download, and the hero scene's first rendered frame. Every task settles on failure too, so a broken asset never blocks the page.

| Setting (`loadingTiming`) | Default | Purpose |
| --- | --- | --- |
| `minDurationMs` | 1800 | Keeps the intro on screen long enough to register on fast connections |
| `reducedMotionMinDurationMs` | 500 | Shorter intro for reduced-motion visitors |
| `maxDurationMs` | 9000 | Hard cap: everything is marked complete after this |
| `exitTimeoutMs` | 3200 | The exit is forced to finish if the fade stalls |

Visitors can skip with the button or <kbd>Esc</kbd>. The page underneath is `inert` and scroll-locked until the intro starts leaving.

### The companion butterfly

One crystal butterfly accompanies the visitor across the whole site. It lives in `ButterflyLayer`: a fixed, full-screen, transparent WebGL canvas above the page and loading screen and below the custom cursor. The layer never receives pointer events (`pointer-events: none` on the wrapper *and* the R3F canvas container, which is clickable by default). It flies its intro path while loading and simply keeps flying when the page appears.

| Behaviour | When |
| --- | --- |
| Intro figure-eight | While the loading screen is up (drifts toward the cursor) |
| Follow | Pointer moved in the last 1.8s. Hovers diagonally off the cursor on the side with room, so it never covers what you point at |
| Orbit | Idle, with the hero sculpture (`[data-butterfly-anchor]`) at least 45% visible. The orbit shrinks to fit the screen and falls back to roaming if it can't clear the chrome core |
| Roam and flourish | Idle elsewhere: wanders the viewport, with a quick spiral every 8–15s (pushed outward during an orbit) |
| Scroll draft | Trails slightly behind while scrolling |
| Rest | `prefers-reduced-motion`: placed at rest in the bottom-right corner, wings breathing slowly |

Leaving the window counts as idle; on touch screens it follows the last touch.

Code map (`src/three/butterfly/`):

| File | Role |
| --- | --- |
| `wingShapes.ts`, `wingTexture.ts` | Wing outlines; painted colour and glow maps (veins, discal cell, eyespot, spot rows, scale flecks) |
| `delaunay.ts`, `wingGeometry.ts` | Triangulates each wing into irregular facets with slight relief, for the cut-crystal look |
| `wingBend.ts` | Vertex-shader membrane flex (flat-shaded facets re-light automatically) |
| `createButterflyModel.ts` | Rig: translucent iridescent crystal wings (pane alpha comes from the painted pattern; veins and margins stay solid), lattice lines, faceted body, swaying abdomen and antennae |
| `sparkles.ts` | Pooled wingtip sparkle trail (single draw call, no per-frame allocation) |
| `flight.ts` | Physics: proportional steering, banking, wingbeat effort, glides, config blending |
| `companionBehaviour.ts` | Pure decision logic for all behaviours above, plus on-screen containment |
| `projection.ts` | Screen and world conversions |
| `../ButterflyCompanion.tsx` | The canvas and per-frame controller |

Tuning: `FLIGHTS` in `companionBehaviour.ts` sets speed and agility per behaviour. In `FlightConfig`, `steering / maxSpeed` is the response rate per second, so raising `steering` makes the butterfly snappier, not just able to accelerate harder. `WINGSPAN` in `ButterflyCompanion.tsx` sets its on-screen size (6.5% of viewport width, 60–110px). Wingbeat calmness lives in `baseFlight.flapHz` and `flapAmplitude`; the secondary motion constants in `flight.ts` (bend, pitch, abdomen, antenna) are sized relative to the flap. The pane translucency is the alpha in `PALETTE` in `wingTexture.ts`.

## Performance

- Three.js and R3F load lazily in their own chunk; the butterfly lives in its own ~10 kB (gzip) lazy chunk and adds nothing to the main bundle. Particle and texture detail scale with the device tier. Particle counts and sculpture detail scale with a device tier (`src/lib/device.ts`).
- Framer Motion features load asynchronously via `LazyMotion`.
- Playground experiments mount only when near the viewport and pause off-screen.
- ScrollTrigger re-measures once web fonts finish loading, so pinned sections start and end in the right place.

## Accessibility

- A skip link is the first focus stop. All controls are real buttons or links with visible focus rings.
- `prefers-reduced-motion` disables Lenis, scroll choreography, physics loops and CSS animations; content renders in its final state. The butterfly rests in a corner instead of flying, and the intro is shortened.
- The loading screen exposes a labelled `progressbar` and announces its status politely; the skip control is keyboard reachable.
- Split text keeps its full string for screen readers through `aria-label`.
- The case-study dialog traps focus, closes on Escape and returns focus to its trigger.
- Form errors are linked with `aria-describedby`, and the submit status is announced through a live region.
- The custom cursor appears only on fine pointers; touch devices keep native behaviour.

## Browser support

Evergreen Chromium, Firefox and Safari. WebGL is required for the 3D pieces; without it the rest of the site still works.
