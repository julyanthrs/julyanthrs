import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Points,
  PointsMaterial,
  type Vector3,
} from "three";
import { createRandom } from "@/lib/random";

const SPRITE_SIZE = 64;

/** Adds to a typed-array slot; indices here are always in range, so a missing slot reads as zero. */
const addAt = (array: Float32Array, index: number, amount: number): number => (array[index] = (array[index] ?? 0) + amount);
const COLORS = [new Color("#ffffff"), new Color("#ffc2e0"), new Color("#ff5aa5")] as const;

export interface SparkleOptions {
  count: number;
  /** Particles emitted per second at full intensity. */
  rate: number;
  /** Seconds each sparkle lives. */
  lifetime: readonly [number, number];
}

const createSprite = (): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context unavailable for sparkle sprite");
  const middle = SPRITE_SIZE / 2;
  const glow = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.25, "rgba(255,220,238,0.8)");
  glow.addColorStop(1, "rgba(255,90,165,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  // A thin four-point star gives the crystal glint.
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.fillRect(middle - 0.75, 4, 1.5, SPRITE_SIZE - 8);
  context.fillRect(4, middle - 0.75, SPRITE_SIZE - 8, 1.5);
  return new CanvasTexture(canvas);
};

/**
 * Glinting particles shed from the wingtips. A fixed-size pool updated in place each frame:
 * no allocations and a single draw call. Additive blending means brightness is the fade.
 */
export class SparkleTrail {
  readonly points: Points;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly velocities: Float32Array;
  private readonly ages: Float32Array;
  private readonly lifetimes: Float32Array;
  private readonly tints: Uint8Array;
  private readonly random = createRandom(97);
  private readonly sprite: CanvasTexture;
  private emitDebt = 0;
  private cursor = 0;

  constructor(private readonly options: SparkleOptions, size: number) {
    const { count } = options;
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.ages = new Float32Array(count).fill(Number.POSITIVE_INFINITY);
    this.lifetimes = new Float32Array(count).fill(1);
    this.tints = new Uint8Array(count);
    this.sprite = createSprite();

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new BufferAttribute(this.colors, 3));
    const material = new PointsMaterial({
      size,
      map: this.sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new Points(geometry, material);
    this.points.frustumCulled = false; // particles span the whole flight path; bounds would go stale
  }

  setSize(size: number): void {
    (this.points.material as PointsMaterial).size = size;
  }

  update(delta: number, emitters: readonly Vector3[], intensity: number, elapsed: number): void {
    const { count, rate, lifetime } = this.options;
    this.emitDebt += delta * rate * intensity;
    while (this.emitDebt >= 1 && emitters.length > 0) {
      this.emitDebt -= 1;
      this.spawn(emitters[Math.floor(this.random() * emitters.length)]!, lifetime);
    }

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const life = 1 - addAt(this.ages, index, delta) / (this.lifetimes[index] ?? 1);
      if (life <= 0) {
        this.colors[offset] = this.colors[offset + 1] = this.colors[offset + 2] = 0;
        continue;
      }
      addAt(this.velocities, offset + 1, -delta * 0.08); // a gentle fall
      addAt(this.positions, offset, (this.velocities[offset] ?? 0) * delta);
      addAt(this.positions, offset + 1, (this.velocities[offset + 1] ?? 0) * delta);
      addAt(this.positions, offset + 2, (this.velocities[offset + 2] ?? 0) * delta);
      const twinkle = 0.6 + 0.4 * Math.sin(elapsed * 22 + index * 1.7);
      const brightness = life * life * twinkle;
      const tint = COLORS[this.tints[index]!]!;
      this.colors[offset] = tint.r * brightness;
      this.colors[offset + 1] = tint.g * brightness;
      this.colors[offset + 2] = tint.b * brightness;
    }

    const geometry = this.points.geometry;
    geometry.getAttribute("position").needsUpdate = true;
    geometry.getAttribute("color").needsUpdate = true;
  }

  private spawn(origin: Vector3, lifetime: readonly [number, number]): void {
    const index = this.cursor;
    this.cursor = (this.cursor + 1) % this.options.count;
    const offset = index * 3;
    const jitter = () => (this.random() - 0.5) * 0.04;
    this.positions[offset] = origin.x + jitter();
    this.positions[offset + 1] = origin.y + jitter();
    this.positions[offset + 2] = origin.z + jitter();
    this.velocities[offset] = (this.random() - 0.5) * 0.12;
    this.velocities[offset + 1] = (this.random() - 0.5) * 0.12 - 0.04;
    this.velocities[offset + 2] = (this.random() - 0.5) * 0.12;
    this.ages[index] = 0;
    this.lifetimes[index] = lifetime[0] + this.random() * (lifetime[1] - lifetime[0]);
    this.tints[index] = Math.floor(this.random() * COLORS.length);
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as PointsMaterial).dispose();
    this.sprite.dispose();
  }
}
