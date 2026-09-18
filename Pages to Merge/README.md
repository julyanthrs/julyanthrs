# Pink Noir Portfolio

An experimental, interaction-heavy portfolio for a web developer and UI/UX designer.
Black, hot pink and soft pink; variable-width typography; a shader-driven 3D mascot; physics, drag and scroll choreography throughout.

## Stack

React 18, TypeScript (strict), Tailwind CSS 3, GSAP + ScrollTrigger, Lenis, Framer Motion, Three.js via React Three Fiber, React Router (hash routing).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Typecheck and production build with route-level code splitting |
| `npm run build:single` | Everything inlined into one `dist/index.html` (hosted previews, email attachments) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run format` | Prettier + Tailwind class sorting |

## Personalise

- `src/data/site.ts`: name, email, location, time zone, socials, process copy
- `src/data/projects.ts`: case studies, metrics, lessons, archive entries
- `src/data/skills.ts`: skill universe
- `src/visuals/scenes.tsx`: abstract SVG artwork per project (swap for real screenshots inside `ProjectVisual` if preferred)
- `index.html`: meta description and title

## Architecture

```
src/
  providers/   SmoothScrollProvider (Lenis ⇄ ScrollTrigger, velocity store, scroll lock)
               TransitionProvider (expanding pink panel, TransitionLink, pageReady signal)
  components/  CustomCursor, Navigation, MenuOverlay, Loader, ScrollProgress, RevealText,
               SectionReveal, MagneticButton, TiltCard, FloatingElement, Marquee,
               ProjectGallery, HorizontalShowcase, ProjectArchive, SkillUniverse,
               Notebook, ProcessMap, ContactForm, Hero3D, DesignDetails, Footer
  pages/       Home, Work, CaseStudy, About, Playground, Contact, NotFound (lazy routes)
  experiments/ Playground experiments (canvas, DOM/SVG, WebGL)
  visuals/     Layered SVG project artwork
  lib/         pointer store, math, motion tokens, sparks, contact service
  hooks/       media queries & capability detection, shared ticker, in-view
```

Performance notes:

- One pointer listener and one GSAP ticker drive cursor, parallax and physics. Per-frame work writes transforms directly, never React state.
- Canvas/WebGL loops pause when offscreen; experiments mount only when approached.
- The 3D blob lowers geometry and pixel ratio on low-power devices and renders a single still frame with reduced motion. Non-WebGL browsers get a CSS orb.
- Fonts are self-hosted Latin subsets (no third-party requests).

Accessibility notes:

- `prefers-reduced-motion` disables smooth scroll, pinning, reveals and cursor lag; content stays fully readable.
- Custom cursor only on fine pointers. All draggables move with arrow keys. Menu traps focus and closes with Escape. Skip link included.

## Easter eggs

Hover the logo. Then click it five times, quickly.
