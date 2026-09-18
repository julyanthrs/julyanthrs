import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Color, Object3D, type InstancedMesh } from 'three';

const GRID = 18;
const SPACING = 0.42;
const HOT = new Color('#FF2D95');
const PETAL = new Color('#FFC1DC');
const CARBON = new Color('#1a1a1a');

function WaveGrid() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const scratch = useMemo(() => new Color(), []);
  const count = GRID * GRID;

  useFrame(({ clock, pointer }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = clock.elapsedTime;
    const focusX = pointer.x * (GRID * SPACING) * 0.5;
    const focusZ = -pointer.y * (GRID * SPACING) * 0.5;

    for (let index = 0; index < count; index += 1) {
      const x = ((index % GRID) - GRID / 2) * SPACING;
      const z = (Math.floor(index / GRID) - GRID / 2) * SPACING;
      const distance = Math.hypot(x - focusX, z - focusZ);
      const lift = Math.max(0, 1.4 - distance) * 1.1;
      const wave = Math.sin(distance * 2.2 - time * 2.4) * 0.18;
      const height = 0.2 + lift + wave;
      dummy.position.set(x, height / 2, z);
      dummy.scale.set(1, height / 0.2, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      scratch.copy(CARBON).lerp(lift > 0.3 ? HOT : PETAL, Math.min(1, lift + Math.max(0, wave) * 1.5));
      mesh.setColorAt(index, scratch);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.rotation.y = Math.sin(time * 0.15) * 0.25;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[SPACING * 0.82, 0.2, SPACING * 0.82]} />
      <meshStandardMaterial roughness={0.35} metalness={0.2} />
    </instancedMesh>
  );
}

export default function WebGLField({ active }: { active: boolean }) {
  return (
    <Canvas
      aria-label="3D grid of pillars that rise under your pointer"
      role="img"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 5.5, 6.5], fov: 40 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} />
      <pointLight position={[-3, 2, -2]} intensity={12} color="#FF2D95" />
      <WaveGrid />
    </Canvas>
  );
}
