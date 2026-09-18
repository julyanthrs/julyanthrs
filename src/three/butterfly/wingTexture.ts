import { CanvasTexture, SRGBColorSpace, type Shape, type Vector2 } from "three";
import { createRandom } from "@/lib/random";
import { OUTLINE_SAMPLES, type ShapeBounds } from "./wingShapes";

/**
 * Panes (the membrane between veins) are translucent; veins, margin, spots and eyespots stay
 * solid. The texture's alpha drives the material's, which gives a stained-glass crystal look
 * while the solid frame keeps the silhouette readable.
 */
const PALETTE = {
  root: "rgba(122, 8, 66, 0.82)",
  deep: "rgba(214, 22, 112, 0.62)",
  hot: "rgba(255, 46, 136, 0.46)",
  soft: "rgba(255, 110, 180, 0.36)",
  pale: "rgba(255, 176, 214, 0.3)",
  vein: "rgba(92, 4, 50, 0.9)",
  margin: "rgba(60, 0, 34, 0.95)",
  spot: "#fff0f7",
  chevron: "rgba(255, 184, 213, 0.85)",
  cellTint: "rgba(255, 214, 234, 0.18)",
  glowVein: "#ff4d9a",
  glowSpot: "#ffffff",
} as const;

export interface WingPattern {
  veinCount: number;
  /** Centre of the pale discal cell near the wing base, in wing space. */
  discalCell: { x: number; y: number };
  /** Eyespot centre and radius in wing space, for the hindwing. */
  eyespot?: { x: number; y: number; radius: number };
  /** Pale highlight near the forewing tip. */
  apexPatch?: { x: number; y: number; radius: number };
}

export interface WingTextures {
  map: CanvasTexture;
  /** Emissive mask: veins, spots and eyespot glow, black elsewhere. */
  glowMap: CanvasTexture;
}

/** Veins only reach margin points at least this far from the hinge (wing-space units). */
const VEIN_MIN_REACH = 0.42;
const VEIN_FORK_AT = 0.62;
const MARGIN_WIDTH = 0.06;
const SPOT_INSET = 0.075;
const CHEVRON_INSET = 0.16;
const SCALE_FLECKS_PER_1000PX = 2600;

const makeCanvas = (size: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context unavailable for wing texture");
  return { canvas, context };
};

const toTexture = (canvas: HTMLCanvasElement, isColor: boolean): CanvasTexture => {
  const texture = new CanvasTexture(canvas);
  if (isColor) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

/**
 * Paints a detailed wing pattern and its matching glow mask. Both use the same bounds the
 * geometry UVs are normalised to, so every stroke lines up with the silhouette.
 */
export const createWingTextures = (shape: Shape, bounds: ShapeBounds, pattern: WingPattern, size: number): WingTextures => {
  const color = makeCanvas(size);
  const glow = makeCanvas(size);
  const random = createRandom(Math.round(bounds.width * 1000) + pattern.veinCount);
  const px = (units: number) => (units / bounds.width) * size;
  const toCanvas = (x: number, y: number): [number, number] => [
    ((x - bounds.minX) / bounds.width) * size,
    (1 - (y - bounds.minY) / bounds.height) * size,
  ];
  const outline = shape.getSpacedPoints(OUTLINE_SAMPLES);
  const reachable = outline.filter((point) => Math.hypot(point.x, point.y) > VEIN_MIN_REACH);
  const pick = (fraction: number): Vector2 => reachable[Math.min(reachable.length - 1, Math.floor(fraction * reachable.length))]!;
  const [hingeX, hingeY] = toCanvas(0, 0);

  const tracePath = (context: CanvasRenderingContext2D, scale = 1) => {
    context.beginPath();
    outline.forEach((point, index) => {
      const [x, y] = toCanvas(point.x * scale, point.y * scale);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
  };

  // --- Colour map --------------------------------------------------------------
  const c = color.context;
  // Canvases start fully transparent, so the gradient's alpha becomes the panes' translucency.
  const base = c.createRadialGradient(hingeX, hingeY, 0, hingeX, hingeY, size * 1.05);
  base.addColorStop(0, PALETTE.root);
  base.addColorStop(0.16, PALETTE.deep);
  base.addColorStop(0.42, PALETTE.hot);
  base.addColorStop(0.74, PALETTE.soft);
  base.addColorStop(1, PALETTE.pale);
  c.fillStyle = base;
  c.fillRect(0, 0, size, size);

  c.save();
  tracePath(c);
  c.clip();

  // Fine scale flecks give the surface a shimmering, dusted texture up close.
  const fleckCount = Math.round((SCALE_FLECKS_PER_1000PX * size) / 1000);
  for (let index = 0; index < fleckCount; index += 1) {
    c.fillStyle = random() > 0.5 ? "rgba(255,255,255,0.1)" : "rgba(255,120,190,0.1)";
    c.beginPath();
    c.ellipse(random() * size, random() * size, 1 + random() * 2.2, 0.6 + random(), random() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }

  // Discal cell: a pale-tinted loop near the base, outlined like a vein.
  const [cellX, cellY] = toCanvas(pattern.discalCell.x, pattern.discalCell.y);
  c.fillStyle = PALETTE.cellTint;
  c.strokeStyle = PALETTE.vein;
  c.lineWidth = px(0.012);
  c.beginPath();
  c.ellipse(cellX, cellY, px(0.16), px(0.07), -0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Branching veins, drawn on both canvases: dark on colour, bright on glow.
  const drawVeins = (context: CanvasRenderingContext2D, stroke: string, width: number) => {
    context.strokeStyle = stroke;
    context.lineCap = "round";
    for (let index = 0; index < pattern.veinCount; index += 1) {
      const fraction = (index + 0.5) / pattern.veinCount;
      const end = pick(fraction);
      const [endX, endY] = toCanvas(end.x, end.y);
      const [forkX, forkY] = toCanvas(end.x * VEIN_FORK_AT, end.y * VEIN_FORK_AT);
      const bendX = (endY - hingeY) * 0.06;
      const bendY = -(endX - hingeX) * 0.06;
      context.lineWidth = width;
      context.beginPath();
      context.moveTo(hingeX, hingeY);
      context.quadraticCurveTo((hingeX + forkX) / 2 + bendX, (hingeY + forkY) / 2 + bendY, forkX, forkY);
      context.lineTo(endX, endY);
      context.stroke();
      // Fork toward the midpoint between this vein and the next.
      const branch = pick(Math.min(1, fraction + 0.5 / pattern.veinCount));
      const [branchX, branchY] = toCanvas(branch.x, branch.y);
      context.lineWidth = width * 0.65;
      context.beginPath();
      context.moveTo(forkX, forkY);
      context.lineTo(branchX, branchY);
      context.stroke();
    }
  };
  drawVeins(c, PALETTE.vein, px(0.011));

  if (pattern.apexPatch) {
    const [ax, ay] = toCanvas(pattern.apexPatch.x, pattern.apexPatch.y);
    const patch = c.createRadialGradient(ax, ay, 0, ax, ay, px(pattern.apexPatch.radius));
    patch.addColorStop(0, "rgba(255, 245, 250, 0.85)");
    patch.addColorStop(1, "rgba(255, 245, 250, 0)");
    c.fillStyle = patch;
    c.fillRect(0, 0, size, size);
  }

  const drawEyespot = (context: CanvasRenderingContext2D, isGlow: boolean) => {
    if (!pattern.eyespot) return;
    const [ex, ey] = toCanvas(pattern.eyespot.x, pattern.eyespot.y);
    const radius = px(pattern.eyespot.radius);
    const rings: ReadonlyArray<[number, string]> = isGlow
      ? [[0.34, PALETTE.glowVein], [0.16, PALETTE.glowSpot]]
      : [[1, PALETTE.margin], [0.78, PALETTE.soft], [0.55, PALETTE.hot], [0.34, PALETTE.root], [0.16, PALETTE.spot]];
    rings.forEach(([fraction, fill]) => {
      context.fillStyle = fill;
      context.beginPath();
      context.arc(ex, ey, radius * fraction, 0, Math.PI * 2);
      context.fill();
    });
  };
  drawEyespot(c, false);

  // Dark margin band just inside the silhouette (a thick stroke on the clipped outline).
  tracePath(c);
  c.strokeStyle = PALETTE.margin;
  c.lineWidth = px(MARGIN_WIDTH) * 2;
  c.stroke();

  const drawSpotRows = (context: CanvasRenderingContext2D, isGlow: boolean) => {
    const count = pattern.veinCount + 3;
    for (let index = 0; index < count; index += 1) {
      const point = pick((index + 0.5) / count);
      const [sx, sy] = toCanvas(point.x * (1 - SPOT_INSET), point.y * (1 - SPOT_INSET));
      context.fillStyle = isGlow ? PALETTE.glowSpot : PALETTE.spot;
      context.beginPath();
      context.arc(sx, sy, px(0.011 + (index % 3) * 0.004), 0, Math.PI * 2);
      context.fill();
      if (isGlow) continue;
      const [chevronX, chevronY] = toCanvas(point.x * (1 - CHEVRON_INSET), point.y * (1 - CHEVRON_INSET));
      context.strokeStyle = PALETTE.chevron;
      context.lineWidth = px(0.008);
      context.beginPath();
      context.arc(chevronX, chevronY, px(0.022), Math.PI * 1.1, Math.PI * 1.9);
      context.stroke();
    }
  };
  drawSpotRows(c, false);
  c.restore();

  // --- Glow map ----------------------------------------------------------------
  const g = glow.context;
  g.fillStyle = "#000";
  g.fillRect(0, 0, size, size);
  g.save();
  tracePath(g);
  g.clip();
  drawVeins(g, PALETTE.glowVein, px(0.006));
  drawEyespot(g, true);
  drawSpotRows(g, true);
  g.restore();

  return { map: toTexture(color.canvas, true), glowMap: toTexture(glow.canvas, true) };
};
