/** Shared motion tokens so choreography stays consistent across sections. */
export const EASE = {
  outExpo: "expo.out",
  outQuart: "power4.out",
  inOut: "power2.inOut",
  spring: "back.out(1.6)",
} as const;

export const DURATION = {
  micro: 0.35,
  base: 0.9,
  reveal: 1.2,
} as const;

export const STAGGER = {
  chars: 0.022,
  words: 0.06,
  items: 0.1,
} as const;

/** Viewport position at which scroll reveals begin. */
export const REVEAL_START = "top 82%";

export const BREAKPOINT = {
  tablet: "(min-width: 768px)",
  desktop: "(min-width: 1024px)",
  finePointer: "(pointer: fine)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;
