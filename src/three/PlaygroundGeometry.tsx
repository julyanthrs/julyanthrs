import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Color,
  DodecahedronGeometry,
  EdgesGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  TorusKnotGeometry,
  type Group,
} from "three";
import { useStudioEnvironment } from "./useStudioEnvironment";

export type GeometryShape = "crystal" | "knot" | "lattice";

export interface DragState {
  rotationX: number;
  rotationY: number;
  velocityX: number;
  velocityY: number;
  isDragging: boolean;
}

const PINK = new Color("#ff2e88");
const BLUSH = new Color("#ffb8d5");
const CHROME = new Color("#e2dfe8");
const INERTIA_DECAY = 0.94;
const IDLE_SPIN = 0.2;

const ShapeModel = ({ shape }: { shape: GeometryShape }) => {
  const geometries = useMemo(
    () => ({
      crystal: new IcosahedronGeometry(1, 0),
      crystalEdges: new EdgesGeometry(new IcosahedronGeometry(1.35, 1)),
      knot: new TorusKnotGeometry(0.75, 0.22, 180, 18, 3, 4),
      knotShell: new TorusKnotGeometry(0.75, 0.34, 90, 8, 3, 4),
      latticeOuter: new EdgesGeometry(new DodecahedronGeometry(1.3, 0)),
      latticeInner: new EdgesGeometry(new OctahedronGeometry(0.85, 0)),
      latticeCore: new OctahedronGeometry(0.4, 0),
    }),
    [],
  );

  if (shape === "crystal") {
    return (
      <>
        <mesh geometry={geometries.crystal}>
          <meshStandardMaterial color={CHROME} metalness={1} roughness={0.12} flatShading />
        </mesh>
        <lineSegments geometry={geometries.crystalEdges}>
          <lineBasicMaterial color={PINK} transparent opacity={0.55} />
        </lineSegments>
      </>
    );
  }

  if (shape === "knot") {
    return (
      <>
        <mesh geometry={geometries.knot}>
          <meshStandardMaterial color={CHROME} metalness={1} roughness={0.18} />
        </mesh>
        <mesh geometry={geometries.knotShell}>
          <meshBasicMaterial color={PINK} wireframe transparent opacity={0.25} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <lineSegments geometry={geometries.latticeOuter}>
        <lineBasicMaterial color={PINK} />
      </lineSegments>
      <lineSegments geometry={geometries.latticeInner} rotation={[0.5, 0.3, 0]}>
        <lineBasicMaterial color={BLUSH} transparent opacity={0.7} />
      </lineSegments>
      <mesh geometry={geometries.latticeCore}>
        <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.6} metalness={0.6} roughness={0.2} flatShading />
      </mesh>
    </>
  );
};

const Scene = ({ shape, drag }: { shape: GeometryShape; drag: React.RefObject<DragState> }) => {
  useStudioEnvironment();
  const groupRef = useRef<Group>(null);
  const scaleRef = useRef(0);
  const lastShape = useRef(shape);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = drag.current;

    if (lastShape.current !== shape) {
      lastShape.current = shape;
      scaleRef.current = 0.2;
    }
    scaleRef.current += (1 - scaleRef.current) * Math.min(1, delta * 7);
    group.scale.setScalar(scaleRef.current);

    if (!state.isDragging) {
      state.rotationY += state.velocityY + delta * IDLE_SPIN;
      state.rotationX += state.velocityX;
      state.velocityX *= INERTIA_DECAY;
      state.velocityY *= INERTIA_DECAY;
    }
    group.rotation.set(state.rotationX, state.rotationY, 0);
  });

  return (
    <group ref={groupRef}>
      <ShapeModel shape={shape} />
    </group>
  );
};

interface PlaygroundGeometryProps {
  active: boolean;
  shape: GeometryShape;
  drag: React.RefObject<DragState>;
}

const PlaygroundGeometry = ({ active, shape, drag }: PlaygroundGeometryProps) => (
  <Canvas
    frameloop={active ? "always" : "never"}
    dpr={[1, 1.5]}
    camera={{ position: [0, 0, 4.2], fov: 40 }}
    gl={{ antialias: true, alpha: true }}
    aria-hidden="true"
  >
    <ambientLight intensity={0.3} />
    <pointLight position={[2.5, 2, 3]} intensity={30} color={PINK} />
    <pointLight position={[-3, -2, 2]} intensity={12} color={BLUSH} />
    <Scene shape={shape} drag={drag} />
  </Canvas>
);

export default PlaygroundGeometry;
