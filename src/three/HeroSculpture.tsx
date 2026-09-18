import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Color, type Group, type Mesh } from "three";
import { damp } from "@/lib/math";
import { scrollState } from "@/lib/scrollState";
import { getDeviceTier } from "@/lib/device";
import { useStudioEnvironment } from "./useStudioEnvironment";
import { SceneLights } from "./SceneLights";
import { usePointerTracker, type PointerSnapshot } from "./pointerTracker";

import { createCageEdges, createDustGeometry, createShards } from "./geometryFactory";

const PINK = new Color("#ff2e88");
const BLUSH = new Color("#ffb8d5");
const CHROME = new Color("#dedbe4");

const RINGS: ReadonlyArray<{ radius: number; tilt: [number, number, number]; speed: number }> = [
  { radius: 1.18, tilt: [Math.PI / 2.4, 0, 0], speed: 0.35 },
  { radius: 1.32, tilt: [0, Math.PI / 3, Math.PI / 5], speed: -0.25 },
  { radius: 1.05, tilt: [Math.PI / 5, Math.PI / 1.7, 0], speed: 0.45 },
];

/** Near-zero rather than zero: a zero scale makes the transform matrix non-invertible. */
const HIDDEN_SCALE = 0.001;
const REVEAL_RATE = 2.2;
/** Extra spin while assembling, proportional to how far from full size the sculpture is. */
const REVEAL_SPIN = 4;

interface SculptureProps {
  rootRef: RefObject<Group | null>;
  pointer: RefObject<PointerSnapshot>;
  reducedMotion: boolean;
  revealed: boolean;
  quality: "low" | "high";
}

const Sculpture = ({ rootRef, pointer, reducedMotion, revealed, quality }: SculptureProps) => {
  useStudioEnvironment();
  const coreRef = useRef<Mesh>(null);
  const cageRef = useRef<Group>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const shardRefs = useRef<(Mesh | null)[]>([]);

  const isHigh = quality === "high";
  const shards = useMemo(() => createShards(isHigh ? 9 : 6), [isHigh]);
  const cageEdges = useMemo(() => createCageEdges(1.62, 1), []);
  const innerCageEdges = useMemo(() => createCageEdges(0.95, 0), []);
  const dust = useMemo(() => createDustGeometry(isHigh ? 220 : 110), [isHigh]);
  const motionScale = reducedMotion ? 0.15 : 1;

  useFrame((_state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const t = damp(3, delta);
    const heroProgress = Math.min(scrollState.scrollY / window.innerHeight, 1.5);

    root.rotation.y += (pointer.current.x * 0.6 - root.rotation.y) * t + delta * 0.12 * motionScale;
    root.rotation.x += (pointer.current.y * 0.35 - root.rotation.x) * t;
    root.position.z += (-heroProgress * 1.8 - root.position.z) * t;
    root.position.y += (heroProgress * 0.4 - root.position.y) * t;

    // Assemble in-scene when the page is revealed (rather than fading the canvas, which holds the butterfly).
    const targetScale = revealed ? 1 : HIDDEN_SCALE;
    const scale = reducedMotion ? targetScale : root.scale.x + (targetScale - root.scale.x) * damp(REVEAL_RATE, delta);
    root.scale.setScalar(scale);
    if (!reducedMotion) root.rotation.y += delta * (1 - scale) * REVEAL_SPIN;

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.25 * motionScale;
      coreRef.current.rotation.z += delta * 0.18 * motionScale;
    }
    if (cageRef.current) {
      cageRef.current.rotation.y -= delta * 0.08 * motionScale;
      cageRef.current.rotation.x += delta * 0.04 * motionScale;
    }
    ringRefs.current.forEach((ring, index) => {
      if (ring) ring.rotation.z += delta * (RINGS[index]?.speed ?? 0) * motionScale;
    });
    shardRefs.current.forEach((shard, index) => {
      const spin = shards[index]?.spin;
      if (!shard || !spin) return;
      shard.rotation.x += delta * spin[0] * motionScale;
      shard.rotation.y += delta * spin[1] * motionScale;
    });
  });

  return (
    <group ref={rootRef} scale={HIDDEN_SCALE}>
      <mesh ref={coreRef}>
        <torusKnotGeometry args={[0.62, 0.17, isHigh ? 260 : 140, isHigh ? 28 : 14, 2, 5]} />
        <meshStandardMaterial color={CHROME} metalness={1} roughness={0.14} envMapIntensity={1.3} />
      </mesh>

      <group ref={cageRef}>
        <lineSegments geometry={cageEdges}>
          <lineBasicMaterial color={PINK} transparent opacity={0.4} />
        </lineSegments>
        <lineSegments geometry={innerCageEdges} rotation={[0.4, 0.2, 0]}>
          <lineBasicMaterial color={BLUSH} transparent opacity={0.22} />
        </lineSegments>
      </group>

      {RINGS.map((ring, index) => (
        <group key={ring.radius} rotation={ring.tilt}>
          <mesh ref={(node) => { ringRefs.current[index] = node; }}>
            <torusGeometry args={[ring.radius, 0.012, 8, isHigh ? 180 : 90, Math.PI * 1.65]} />
            <meshStandardMaterial
              color={index === 1 ? PINK : CHROME}
              emissive={index === 1 ? PINK : BLUSH}
              emissiveIntensity={index === 1 ? 0.9 : 0.08}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {shards.map((shard, index) => (
        <mesh
          key={index}
          ref={(node) => { shardRefs.current[index] = node; }}
          geometry={shard.geometry}
          position={shard.position}
          scale={shard.scale}
        >
          <meshPhysicalMaterial
            color={index % 3 === 0 ? PINK : BLUSH}
            metalness={0.1}
            roughness={0.05}
            clearcoat={1}
            transparent
            opacity={0.55}
            flatShading
            envMapIntensity={1.6}
          />
        </mesh>
      ))}

      <points geometry={dust}>
        <pointsMaterial color={BLUSH} size={0.018} sizeAttenuation transparent opacity={0.65} depthWrite={false} />
      </points>
    </group>
  );
};

const FirstFrameSignal = ({ onReady }: { onReady: () => void }) => {
  const hasFired = useRef(false);
  useFrame(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    onReady();
  });
  return null;
};

interface HeroSculptureProps {
  active: boolean;
  reducedMotion: boolean;
  /** Becomes true when the loading screen starts leaving; the sculpture assembles then. */
  revealed: boolean;
  /** Called after the first rendered frame, which marks the scene as loaded. */
  onReady: () => void;
}

/** Abstract chrome knot inside a wireframe cage, with orbiting glass shards. Lazy-loaded. */
const HeroSculpture = ({ active, reducedMotion, revealed, onReady }: HeroSculptureProps) => {
  const pointer = usePointerTracker();
  const rootRef = useRef<Group>(null);
  const tier = useMemo(getDeviceTier, []);
  const quality = tier === "high" ? "high" : "low";

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 0, 5.2], fov: 40 }}
      gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <SceneLights />
      <Sculpture rootRef={rootRef} pointer={pointer} reducedMotion={reducedMotion} revealed={revealed} quality={quality} />
      <FirstFrameSignal onReady={onReady} />
    </Canvas>
  );
};

export default HeroSculpture;
