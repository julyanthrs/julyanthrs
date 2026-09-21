import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3, type PerspectiveCamera } from "three";
import { clamp } from "@/lib/math";
import { getDeviceTier } from "@/lib/device";
import { scrollState } from "@/lib/scrollState";
import { SceneLights } from "./SceneLights";
import { useStudioEnvironment } from "./useStudioEnvironment";
import { usePointerTracker, type PointerSnapshot } from "./pointerTracker";
import {
  COMPANION_CAMERA,
  computeCompanionFrame,
  containInView,
  createCompanionMemory,
  FLIGHTS,
  PERCH_ORIENTATION,
  type AnchorRect,
  type CompanionFrame,
  type CompanionPhase,
} from "./butterfly/companionBehaviour";
import { MODEL_WINGSPAN, type ButterflyQuality } from "./butterfly/createButterflyModel";
import { computeWingPose, createFlightState, createWingPose, stepFlight } from "./butterfly/flight";
import { pixelsPerWorldUnit } from "./butterfly/projection";
import { SparkleTrail } from "./butterfly/sparkles";
import { useButterflyModel } from "./butterfly/useButterflyModel";

const MAX_DELTA = 1 / 30;
/** On-screen wingspan at neutral depth: a share of viewport width, within sensible pixel limits. */
const WINGSPAN = { viewportShare: 0.04, minPx: 36, maxPx: 68 } as const;
/** The pointer counts as idle after this long without moving. */
const POINTER_IDLE_MS = 1800;
const ANCHOR_SELECTOR = "[data-butterfly-anchor]";
/** Re-measure the anchor every few frames; it only moves when the page scrolls or resizes. */
const ANCHOR_REFRESH_FRAMES = 6;
const SPARKLES = {
  high: { count: 90, rate: 34, lifetime: [0.7, 1.3] as const },
  low: { count: 40, rate: 16, lifetime: [0.6, 1] as const },
} as const;
/** Sparkle size relative to the butterfly's world wingspan. */
const SPARKLE_SIZE_SHARE = 0.09;

interface CompanionFlightProps {
  phase: CompanionPhase;
  reducedMotion: boolean;
  quality: ButterflyQuality;
  pointer: RefObject<PointerSnapshot>;
}

const CompanionFlight = ({ phase, reducedMotion, quality, pointer }: CompanionFlightProps) => {
  useStudioEnvironment();
  const model = useButterflyModel(quality);
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const scene = useThree((state) => state.scene);
  const initialSize = useThree((state) => state.size);

  const sparkles = useMemo(() => new SparkleTrail(SPARKLES[quality], 0.05), [quality]);
  const flight = useRef(createFlightState(new Vector3(-1.5, -0.4, 0), 5.1)).current;
  const pose = useRef(createWingPose()).current;
  const memory = useRef(createCompanionMemory(31, initialSize)).current;
  const frame = useRef<CompanionFrame>({ target: new Vector3(), config: { ...FLIGHTS.roam }, mode: "intro", snap: false }).current;
  const tips = useMemo(() => [new Vector3(), new Vector3(), new Vector3(), new Vector3()], []);
  const anchor = useRef<{ element: Element | null; rect: AnchorRect | null; frames: number }>({ element: null, rect: null, frames: 0 }).current;

  useLayoutEffect(() => {
    scene.add(sparkles.points);
    return () => {
      scene.remove(sparkles.points);
      sparkles.dispose();
    };
  }, [scene, sparkles]);

  useEffect(() => {
    anchor.element = null; // re-query after remounts, in case the hero re-rendered
  }, [anchor, phase]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const elapsed = state.clock.elapsedTime;
    const { width, height } = state.size;

    if (anchor.frames++ % ANCHOR_REFRESH_FRAMES === 0) {
      anchor.element ??= document.querySelector(ANCHOR_SELECTOR);
      const rect = anchor.element?.getBoundingClientRect();
      anchor.rect = rect && rect.width > 0 ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
    }

    const wingspanPx = clamp(width * WINGSPAN.viewportShare, WINGSPAN.minPx, WINGSPAN.maxPx);
    const scale = wingspanPx / (MODEL_WINGSPAN * pixelsPerWorldUnit(camera, COMPANION_CAMERA.z, height));
    const wingspanWorld = MODEL_WINGSPAN * scale;

    const snapshot = pointer.current;
    const engaged = snapshot.lastMoveAt > 0 && performance.now() - snapshot.lastMoveAt < POINTER_IDLE_MS;

    computeCompanionFrame(
      {
        camera,
        viewport: { width, height },
        flight,
        elapsed,
        delta,
        pointer: engaged ? snapshot : null,
        scrollVelocity: scrollState.velocity,
        anchor: anchor.rect,
        phase,
        reducedMotion,
        wingspanPx,
        wingspanWorld,
      },
      memory,
      frame,
    );
    if (frame.snap) {
      // Reduced motion: rest in place with a still, readable pose; only the wings breathe.
      flight.position.copy(frame.target);
      flight.velocity.set(0, 0, 0);
      flight.quaternion.copy(PERCH_ORIENTATION);
    }
    stepFlight(flight, frame.target, delta, frame.config);
    if (frame.snap) flight.quaternion.copy(PERCH_ORIENTATION);
    containInView(camera, flight, wingspanWorld * 0.52);

    model.root.position.copy(flight.position);
    model.root.quaternion.copy(flight.quaternion);
    model.root.scale.setScalar(scale);
    model.applyPose(computeWingPose(flight, elapsed, frame.config, pose));

    if (!reducedMotion) {
      sparkles.setSize(wingspanWorld * SPARKLE_SIZE_SHARE);
      const speedShare = clamp(flight.velocity.length() / FLIGHTS.follow.maxSpeed, 0, 1);
      sparkles.update(delta, model.getWingtips(tips), 0.35 + flight.effort * 0.4 + speedShare * 0.6, elapsed);
    }
  });

  return <primitive object={model.root} />;
};

interface ButterflyCompanionProps {
  /** True while the loading screen is up: the butterfly flies its intro path. */
  intro: boolean;
  reducedMotion: boolean;
}

/**
 * Full-screen, click-through canvas hosting the site-wide butterfly: it flies the loading
 * intro, then follows the cursor, circles the hero sculpture and roams. Lazy-loaded.
 */
const ButterflyCompanion = ({ intro, reducedMotion }: ButterflyCompanionProps) => {
  const pointer = usePointerTracker();
  const quality: ButterflyQuality = useMemo(() => (getDeviceTier() === "high" ? "high" : "low"), []);

  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.5] : [1, 1.15]}
      camera={{ position: [0, 0, COMPANION_CAMERA.z], fov: COMPANION_CAMERA.fov }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // R3F makes its wrapper clickable by default; this layer must never intercept the page.
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <SceneLights />
      <pointLight position={[0, -3, 4]} intensity={14} color="#ffd6ea" />
      <CompanionFlight phase={intro ? "intro" : "site"} reducedMotion={reducedMotion} quality={quality} pointer={pointer} />
    </Canvas>
  );
};

export default ButterflyCompanion;
