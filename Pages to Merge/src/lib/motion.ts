export const EASE = {
  cinematic: [0.76, 0, 0.24, 1] as [number, number, number, number],
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const SPRING = {
  magnetic: { stiffness: 220, damping: 16, mass: 0.6 },
  tilt: { stiffness: 170, damping: 20, mass: 0.5 },
};

export const MEDIA = {
  tablet: '(min-width: 768px)',
  desktop: '(min-width: 1024px)',
  finePointer: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  motionOk: '(prefers-reduced-motion: no-preference)',
};
