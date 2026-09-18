let cachedSupport: boolean | null = null;

/**
 * Whether this browser can create a WebGL context. Checked once and cached.
 * Needed because R3F creates its renderer asynchronously, so a missing context
 * surfaces as an uncaught error that React error boundaries never see.
 */
export const supportsWebGL = (): boolean => {
  if (cachedSupport !== null) return cachedSupport;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Release the probe context right away; browsers cap how many can be live.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    cachedSupport = context !== null;
  } catch {
    cachedSupport = false;
  }
  return cachedSupport;
};
