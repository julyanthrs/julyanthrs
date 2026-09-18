/**
 * Cached dynamic imports for the WebGL scenes. The loading screen starts these downloads
 * early and reports on them; React.lazy reuses the same promise, so each chunk loads once.
 * Imports go through here rather than straight to the modules so Three.js stays out of the main bundle.
 */
let heroScene: Promise<typeof import("./HeroSculpture")> | null = null;
let companionScene: Promise<typeof import("./ButterflyCompanion")> | null = null;

export const loadHeroScene = () => (heroScene ??= import("./HeroSculpture"));
export const loadCompanionScene = () => (companionScene ??= import("./ButterflyCompanion"));
