import { Color } from "three";

const PINK = new Color("#ff2e88");
const BLUSH = new Color("#ffb8d5");

/**
 * Shared lighting rig. The hero and loading scenes must light the butterfly identically,
 * or the handoff between their two canvases would show a visible colour jump.
 */
export const SceneLights = () => (
  <>
    <ambientLight intensity={0.25} />
    <pointLight position={[3, 2, 3]} intensity={40} color={PINK} />
    <pointLight position={[-3, -1.5, 2]} intensity={18} color={BLUSH} />
    <directionalLight position={[0, 4, 5]} intensity={1.2} />
  </>
);
