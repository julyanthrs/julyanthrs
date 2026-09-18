import {
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
  EdgesGeometry,
} from "three";
import { createRandom } from "@/lib/random";

export interface ShardConfig {
  geometry: BufferGeometry;
  position: [number, number, number];
  scale: [number, number, number];
  spin: [number, number, number];
}


export const createShards = (count: number, seed = 7): ShardConfig[] => {
  const random = createRandom(seed);
  const baseGeometries = [new OctahedronGeometry(0.22, 0), new TetrahedronGeometry(0.26, 0)];
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + random() * 0.6;
    const radius = 1.55 + random() * 0.45;
    const stretch = 0.6 + random() * 1.6;
    return {
      geometry: baseGeometries[index % baseGeometries.length]!,
      position: [Math.cos(angle) * radius, (random() - 0.5) * 1.8, Math.sin(angle) * radius * 0.6],
      scale: [0.7 + random() * 0.5, stretch, 0.5 + random() * 0.4],
      spin: [random() * 0.6 + 0.2, random() * 0.8 + 0.2, random() * 0.4],
    };
  });
};

export const createCageEdges = (radius: number, detail: number): EdgesGeometry =>
  new EdgesGeometry(new IcosahedronGeometry(radius, detail));

/** Sparse points scattered on a flattened shell, so the cloud reads as a field rather than a planet. */
export const createDustGeometry = (count: number, seed = 21): BufferGeometry => {
  const random = createRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const radius = 2 + random() * 0.9;
    positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = radius * Math.cos(phi) * 0.55;
    positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
};
