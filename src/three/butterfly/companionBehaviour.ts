import { Euler, MathUtils, Quaternion, Vector3, type PerspectiveCamera } from "three";
import { clamp, damp } from "@/lib/math";
import { createRandom } from "@/lib/random";
import { mixFlightConfig, wander, type FlightConfig, type FlightState } from "./flight";
import { clampToView, halfHeightAtDepth, worldPointAtScreen } from "./projection";

export const COMPANION_CAMERA = { z: 6, fov: 40 } as const;

export type CompanionPhase = "intro" | "site";
export type CompanionMode = "intro" | "follow" | "orbit" | "roam" | "flourish" | "perch";

const baseFlight: FlightConfig = {
  maxSpeed: 2.6,
  steering: 5.5,
  arrivalRadius: 1.3,
  bank: 0.5,
  turnRate: 5.5,
  pitchFollow: 0.5,
  // Calm wingbeat: slow and moderate, so the butterfly stays in the corner of your eye rather than demanding attention.
  flapHz: [3.2, 5.5],
  flapAmplitude: 0.72,
  dihedral: 0.32,
  bobAmount: 0.035,
  glideTendency: 1,
};

export const FLIGHTS = {
  intro: { ...baseFlight, maxSpeed: 3.2, steering: 7, flapHz: [3.5, 6], flapAmplitude: 0.76 },
  roam: baseFlight,
  /** Quick, agile pursuit: roughly 2400 px/s top speed on a 900px-tall viewport. */
  follow: { ...baseFlight, maxSpeed: 12, steering: 64, arrivalRadius: 0.8, bank: 0.6, turnRate: 12, pitchFollow: 0.45, flapHz: [4.5, 7], flapAmplitude: 0.8, bobAmount: 0.04, glideTendency: 0.3 },
  perch: { ...baseFlight, maxSpeed: 0.5, steering: 1.5, arrivalRadius: 0.8, bank: 0.2, turnRate: 3, pitchFollow: 0.3, flapHz: [0.4, 0.5], flapAmplitude: 0.3, dihedral: 0.55, bobAmount: 0.01, glideTendency: 0 },
} satisfies Record<string, FlightConfig>;

/** Resting pose for reduced motion: seen from above, wings visible, head angled up and left. */
export const PERCH_ORIENTATION = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, Math.PI * 0.85, "ZXY"));

const FOLLOW = {
  engageRate: 16,
  releaseRate: 1.4,
  /** Hover diagonally off the cursor, in wingspans, so it never covers what you point at; the side adapts to the room available. */
  offsetX: 0.55,
  offsetY: -0.5,
  hoverRadius: 0.3,
  depth: 0.5,
  /** Hover-side switching points as shares of the viewport, with a dead zone so it doesn't flicker. */
  switchLow: 0.4,
  switchHigh: 0.6,
  sideRate: 5,
  /** A pointer this many wingspans from the body counts as a jump: the hover side snaps instead of easing. */
  jumpSpans: 3,
} as const;

const ORBIT = {
  /** Radians per second around the anchor (the hero sculpture). */
  speed: 0.9,
  /** Ellipse radii as fractions of the anchor's size. */
  radiusX: 0.58,
  radiusY: 0.48,
  depth: 1.1,
  /** Chrome core radius as a share of the anchor's width; the orbit must clear it plus some wingspan. */
  coreShare: 0.21,
  /** Extra clearance in wingspans; covers the body cutting slightly inside the ellipse on turns. */
  clearanceSpans: 0.8,
  /** Anchor must be at least this visible (by area) to orbit it. */
  minVisibleShare: 0.45,
} as const;

const ROAM = {
  minHoldSeconds: 2.6,
  extraHoldSeconds: 3,
  /** Pick a new point once within this many wingspans of the current one. */
  arriveWithin: 0.6,
  /** Keep roam points this many wingspans away from the viewport edges. */
  edgeMargin: 1,
  wander: 0.4,
  depth: 1.1,
} as const;

const FLOURISH = {
  seconds: 1.4,
  /** Seconds to ease back from agile to relaxed flight afterwards, so momentum is braked, not coasted. */
  settleSeconds: 0.7,
  /** Radians per second around the loop. */
  speed: 5,
  radius: 0.9,
  minGapSeconds: 8,
  extraGapSeconds: 7,
} as const;

const INTRO = { speed: 0.55, widthShare: 0.28, maxWidthPx: 420, heightShare: 0.16, centreYShare: 0.46, depth: 1.2, pointerPull: 0.3 } as const;

const GUST = { pxPerVelocity: 5, maxPx: 140, rate: 3 } as const;

/** Wingtips stay this many wingspans inside the viewport edges. */
const SCREEN_MARGIN_SPANS = 0.55;

export interface AnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CompanionMemory {
  followWeight: number;
  orbitAngle: number;
  roamX: number;
  roamY: number;
  roamUntil: number;
  flourishStart: number;
  nextFlourishAt: number;
  gustPx: number;
  random: () => number;
  /** Last screen position the butterfly aimed for, used to detect arrival. */
  screenX: number;
  screenY: number;
  /** Which side of the cursor to hover on: +1 right/below, -1 left/above (eased, so it swings across). */
  sideX: number;
  sideY: number;
  /** Idle behaviour on the previous frame, to detect entering an orbit. */
  lastIdleMode: CompanionMode;
}

export const createCompanionMemory = (seed: number, viewport: { width: number; height: number }): CompanionMemory => ({
  followWeight: 0,
  orbitAngle: 0,
  roamX: viewport.width / 2,
  roamY: viewport.height / 2,
  roamUntil: 0,
  flourishStart: Number.NEGATIVE_INFINITY,
  nextFlourishAt: FLOURISH.minGapSeconds,
  gustPx: 0,
  random: createRandom(seed),
  screenX: viewport.width / 2,
  screenY: viewport.height / 2,
  sideX: 1,
  sideY: -1,
  lastIdleMode: "roam",
});

const bodyScreen = new Vector3();
const settleConfig: FlightConfig = { ...baseFlight };

/** Picks the hover side with the most room, switching only after crossing a dead zone. */
const updateHoverSide = (current: number, pointerShare: number, delta: number, snap: boolean): number => {
  const desired = pointerShare < FOLLOW.switchLow ? 1 : pointerShare > FOLLOW.switchHigh ? -1 : Math.sign(current) || 1;
  return snap ? desired : current + (desired - current) * damp(FOLLOW.sideRate, delta);
};

export interface CompanionInput {
  camera: PerspectiveCamera;
  viewport: { width: number; height: number };
  flight: FlightState;
  elapsed: number;
  delta: number;
  /** Cursor or last touch in viewport pixels; null when idle, never moved, or outside the window. */
  pointer: { clientX: number; clientY: number } | null;
  /** Scroll velocity in px per frame (positive when scrolling down). */
  scrollVelocity: number;
  anchor: AnchorRect | null;
  phase: CompanionPhase;
  reducedMotion: boolean;
  /** Desired on-screen wingspan at the neutral depth. */
  wingspanPx: number;
  /** World-space wingspan at the current scale. */
  wingspanWorld: number;
}

export interface CompanionFrame {
  target: Vector3;
  config: FlightConfig;
  mode: CompanionMode;
  /** When true the caller should place the butterfly at the target at rest (reduced motion). */
  snap: boolean;
}

interface Orbit {
  centreX: number;
  centreY: number;
  radiusX: number;
  radiusY: number;
  /** Radius the butterfly's body must stay outside of, in pixels. */
  clearance: number;
}

/**
 * Fits an orbit around the anchor inside the viewport. Returns null when the space left would
 * force the path over the sculpture's core (anchor near an edge, or a small screen).
 */
const fitOrbit = (anchor: AnchorRect, viewport: { width: number; height: number }, wingspanPx: number, margin: number): Orbit | null => {
  if (visibleShare(anchor, viewport) < ORBIT.minVisibleShare) return null;
  const centreX = anchor.left + anchor.width / 2;
  const centreY = anchor.top + anchor.height / 2;
  const radiusX = Math.min(anchor.width * ORBIT.radiusX, centreX - margin, viewport.width - margin - centreX);
  const radiusY = Math.min(anchor.height * ORBIT.radiusY, centreY - margin, viewport.height - margin - centreY);
  const clearance = anchor.width * ORBIT.coreShare + wingspanPx * ORBIT.clearanceSpans;
  return radiusX >= clearance && radiusY >= clearance ? { centreX, centreY, radiusX, radiusY, clearance } : null;
};

const visibleShare = (rect: AnchorRect, viewport: { width: number; height: number }): number => {
  const width = Math.max(0, Math.min(rect.left + rect.width, viewport.width) - Math.max(rect.left, 0));
  const height = Math.max(0, Math.min(rect.top + rect.height, viewport.height) - Math.max(rect.top, 0));
  return rect.width * rect.height > 0 ? (width * height) / (rect.width * rect.height) : 0;
};

const drift = new Vector3();

/**
 * Decides where the companion butterfly heads this frame and how it flies there.
 * Positions are chosen in screen pixels, then placed at a depth for size and parallax.
 */
export const computeCompanionFrame = (input: CompanionInput, memory: CompanionMemory, out: CompanionFrame): CompanionFrame => {
  const { camera, viewport, flight, elapsed, delta, pointer, anchor, wingspanPx } = input;
  let x: number;
  let y: number;
  let z: number;
  out.snap = false;
  const margin = wingspanPx * SCREEN_MARGIN_SPANS;

  if (input.reducedMotion) {
    out.snap = true;
    memory.followWeight = 0;
    x = viewport.width - wingspanPx * 1.3;
    y = viewport.height - wingspanPx * 1.1;
    z = 0;
    mixFlightConfig(FLIGHTS.perch, FLIGHTS.perch, 0, out.config);
    out.mode = "perch";
  } else if (input.phase === "intro") {
    const t = elapsed * INTRO.speed;
    wander(elapsed, flight.seed, drift);
    x = viewport.width / 2 + Math.sin(t) * Math.min(viewport.width * INTRO.widthShare, INTRO.maxWidthPx) + drift.x * wingspanPx * 0.5;
    y = viewport.height * INTRO.centreYShare + Math.sin(t * 2) * viewport.height * INTRO.heightShare + drift.y * wingspanPx * 0.5;
    z = Math.cos(t) * INTRO.depth;
    if (pointer) {
      x += (pointer.clientX - x) * INTRO.pointerPull;
      y += (pointer.clientY - y) * INTRO.pointerPull;
    }
    mixFlightConfig(FLIGHTS.intro, FLIGHTS.intro, 0, out.config);
    out.mode = "intro";
  } else {
    memory.followWeight += ((pointer ? 1 : 0) - memory.followWeight) * damp(pointer ? FOLLOW.engageRate : FOLLOW.releaseRate, delta);
    wander(elapsed, flight.seed, drift);
    bodyScreen.copy(flight.position).project(camera);
    const bodyX = ((bodyScreen.x + 1) / 2) * viewport.width;
    const bodyY = ((1 - bodyScreen.y) / 2) * viewport.height;

    // Idle behaviour: flourish loop, orbit the anchor, or roam.
    let idleX: number;
    let idleY: number;
    let idleZ: number;
    let idleConfig: FlightConfig = FLIGHTS.roam;
    let idleMode: CompanionMode;
    let orbit: Orbit | null = null;
    const isFlourishing = elapsed - memory.flourishStart < FLOURISH.seconds;

    const availableOrbit = anchor ? fitOrbit(anchor, viewport, wingspanPx, margin) : null;

    if (!isFlourishing && elapsed > memory.nextFlourishAt && memory.followWeight < 0.1) {
      memory.flourishStart = elapsed;
      memory.roamX = memory.screenX;
      memory.roamY = memory.screenY;
      if (availableOrbit) {
        // Loop outside the orbit, never toward the sculpture: shift the loop centre outward by its radius.
        const outwardX = memory.screenX - availableOrbit.centreX;
        const outwardY = memory.screenY - availableOrbit.centreY;
        const length = Math.hypot(outwardX, outwardY) || 1;
        const shift = FLOURISH.radius * wingspanPx * 1.1;
        memory.roamX += (outwardX / length) * shift;
        memory.roamY += (outwardY / length) * shift;
      }
      memory.nextFlourishAt = elapsed + FLOURISH.minGapSeconds + memory.random() * FLOURISH.extraGapSeconds;
    }

    if (elapsed - memory.flourishStart < FLOURISH.seconds) {
      const angle = (elapsed - memory.flourishStart) * FLOURISH.speed;
      const radius = FLOURISH.radius * wingspanPx;
      idleX = memory.roamX + Math.cos(angle) * radius;
      idleY = memory.roamY + Math.sin(angle) * radius * 0.7;
      idleZ = Math.sin(angle) * 0.8;
      idleConfig = FLIGHTS.follow;
      idleMode = "flourish";
    } else if ((orbit = availableOrbit)) {
      const insideClearance = Math.hypot(bodyX - orbit.centreX, bodyY - orbit.centreY) < orbit.clearance;
      if (memory.lastIdleMode !== "orbit" || insideClearance) {
        // Aim for the orbit point nearest the body: the way out (or in) is radial, never across the sculpture.
        memory.orbitAngle = Math.atan2((bodyY - orbit.centreY) / orbit.radiusY, (bodyX - orbit.centreX) / orbit.radiusX);
      }
      memory.orbitAngle += delta * ORBIT.speed;
      const angle = memory.orbitAngle;
      idleX = orbit.centreX + Math.cos(angle) * orbit.radiusX;
      idleY = orbit.centreY + Math.sin(angle) * orbit.radiusY;
      // Lower arc passes nearer the viewer, upper arc farther away.
      idleZ = Math.sin(angle) * ORBIT.depth - 0.1;
      idleMode = "orbit";
      if (insideClearance) idleConfig = FLIGHTS.follow; // brake and leave promptly
    } else {
      const arrived = Math.hypot(memory.screenX - memory.roamX, memory.screenY - memory.roamY) < wingspanPx * ROAM.arriveWithin;
      if (elapsed > memory.roamUntil || arrived) {
        const margin = wingspanPx * ROAM.edgeMargin;
        memory.roamX = margin + memory.random() * Math.max(1, viewport.width - margin * 2);
        memory.roamY = margin + memory.random() * Math.max(1, viewport.height - margin * 2);
        memory.roamUntil = elapsed + ROAM.minHoldSeconds + memory.random() * ROAM.extraHoldSeconds;
      }
      idleX = memory.roamX + drift.x * wingspanPx * ROAM.wander;
      idleY = memory.roamY + drift.y * wingspanPx * ROAM.wander;
      idleZ = drift.z * ROAM.depth - 0.2;
      idleMode = "roam";
    }

    if (pointer) {
      // Hover on the side of the cursor that has room: right of it on the left half, left of it on the right half.
      const isJump = Math.hypot(pointer.clientX - bodyX, pointer.clientY - bodyY) > wingspanPx * FOLLOW.jumpSpans;
      memory.sideX = updateHoverSide(memory.sideX, pointer.clientX / viewport.width, delta, isJump);
      memory.sideY = updateHoverSide(memory.sideY, pointer.clientY / viewport.height, delta, isJump);
    }

    // Just after a flourish, keep some agility so leftover momentum is braked rather than coasted.
    const sinceFlourishEnd = elapsed - memory.flourishStart - FLOURISH.seconds;
    if (idleMode !== "flourish" && sinceFlourishEnd >= 0 && sinceFlourishEnd < FLOURISH.settleSeconds) {
      const settle = 1 - sinceFlourishEnd / FLOURISH.settleSeconds;
      idleConfig = mixFlightConfig(idleConfig, FLIGHTS.follow, settle, settleConfig);
    }
    const followX = (pointer?.clientX ?? idleX) + wingspanPx * (Math.abs(FOLLOW.offsetX) * memory.sideX + Math.cos(elapsed * 2.4) * FOLLOW.hoverRadius);
    const followY = (pointer?.clientY ?? idleY) + wingspanPx * (Math.abs(FOLLOW.offsetY) * memory.sideY + Math.sin(elapsed * 3.3) * FOLLOW.hoverRadius * 0.7);
    const followZ = FOLLOW.depth + 0.35 * Math.sin(elapsed * 1.4);

    memory.lastIdleMode = idleMode;
    const weight = memory.followWeight;
    x = MathUtils.lerp(idleX, followX, weight);
    y = MathUtils.lerp(idleY, followY, weight);
    z = MathUtils.lerp(idleZ, followZ, weight);
    mixFlightConfig(idleConfig, FLIGHTS.follow, weight, out.config);
    out.mode = weight > 0.5 ? "follow" : idleMode;

    // Scrolling leaves it trailing slightly behind, as if caught in the draft.
    const gustTarget = clamp(-input.scrollVelocity * GUST.pxPerVelocity, -GUST.maxPx, GUST.maxPx);
    memory.gustPx += (gustTarget - memory.gustPx) * damp(GUST.rate, delta);
    y += memory.gustPx;
  }

  x = clamp(x, margin, Math.max(margin, viewport.width - margin));
  y = clamp(y, margin, Math.max(margin, viewport.height - margin));
  memory.screenX = x;
  memory.screenY = y;

  const rect = { left: 0, top: 0, width: viewport.width, height: viewport.height };
  worldPointAtScreen(camera, rect, x, y, camera.position.z - z, out.target);
  clampToView(camera, out.target, input.wingspanWorld * SCREEN_MARGIN_SPANS);
  return out;
};

/**
 * Soft wall on the body: steering lag can carry the butterfly past its target in fast turns.
 * Caps the position so wingtips stay on screen and cancels only the outward velocity.
 */
export const containInView = (camera: PerspectiveCamera, flight: FlightState, allowance: number): void => {
  const { position, velocity } = flight;
  const halfHeight = halfHeightAtDepth(camera, Math.max(camera.near * 2, camera.position.z - position.z));
  const limits = { x: Math.max(0, halfHeight * camera.aspect - allowance), y: Math.max(0, halfHeight - allowance) };
  (["x", "y"] as const).forEach((axis) => {
    const offset = position[axis] - camera.position[axis];
    if (Math.abs(offset) <= limits[axis]) return;
    const direction = Math.sign(offset);
    position[axis] = camera.position[axis] + direction * limits[axis];
    if (Math.sign(velocity[axis]) === direction) velocity[axis] = 0;
  });
};
