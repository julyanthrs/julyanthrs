import { BufferGeometry, EdgesGeometry, Float32BufferAttribute, type Shape } from "three";
import { createRandom } from "@/lib/random";
import { isInsidePolygon, triangulate, type Point2 } from "./delaunay";
import { OUTLINE_SAMPLES, type ShapeBounds } from "./wingShapes";

export interface FacetOptions {
  /** Approximate distance between interior facet vertices, in wing-space units. */
  spacing: number;
  /** Maximum out-of-plane offset per interior vertex; this is what makes facets catch light. */
  relief: number;
  seed: number;
}

export interface FacetedWing {
  surface: BufferGeometry;
  /** Facet edges, for the faint crystal-lattice lines. */
  edges: BufferGeometry;
}

const JITTER = 0.35;
/** Interior points closer than this fraction of `spacing` to the outline are dropped, to avoid slivers. */
const EDGE_KEEP_OUT = 0.45;
const EDGE_ANGLE_THRESHOLD_DEGREES = 1;

const distanceToOutline = (x: number, y: number, outline: readonly Point2[]): number =>
  outline.reduce((nearest, [ox, oy]) => Math.min(nearest, Math.hypot(x - ox, y - oy)), Number.POSITIVE_INFINITY);

/**
 * Triangulates a wing outline into irregular facets with slight relief, so that
 * flat shading gives each facet its own highlight, like cut crystal.
 */
export const createFacetedWing = (shape: Shape, bounds: ShapeBounds, options: FacetOptions): FacetedWing => {
  const random = createRandom(options.seed);
  const outline: Point2[] = shape.getSpacedPoints(OUTLINE_SAMPLES).slice(0, -1).map((point) => [point.x, point.y]);

  const interior: Point2[] = [];
  const rowHeight = options.spacing * 0.866;
  for (let row = 0, y = bounds.minY; y <= bounds.minY + bounds.height; row += 1, y += rowHeight) {
    const shift = row % 2 === 0 ? 0 : options.spacing / 2;
    for (let x = bounds.minX + shift; x <= bounds.minX + bounds.width; x += options.spacing) {
      const px = x + (random() - 0.5) * options.spacing * JITTER;
      const py = y + (random() - 0.5) * options.spacing * JITTER;
      if (isInsidePolygon(px, py, outline) && distanceToOutline(px, py, outline) > options.spacing * EDGE_KEEP_OUT) {
        interior.push([px, py]);
      }
    }
  }

  const points = [...outline, ...interior];
  // Delaunay fills the convex hull; keep only triangles whose centroid lies inside the concave outline.
  const triangles: number[] = [];
  const all = triangulate(points);
  for (let offset = 0; offset < all.length; offset += 3) {
    const a = points[all[offset]!]!;
    const b = points[all[offset + 1]!]!;
    const c = points[all[offset + 2]!]!;
    if (isInsidePolygon((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, outline)) {
      triangles.push(all[offset]!, all[offset + 1]!, all[offset + 2]!);
    }
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  points.forEach(([x, y], index) => {
    const isOutline = index < outline.length;
    positions.push(x, y, isOutline ? 0 : (random() - 0.5) * 2 * options.relief);
    uvs.push((x - bounds.minX) / bounds.width, (y - bounds.minY) / bounds.height);
  });

  const surface = new BufferGeometry();
  surface.setAttribute("position", new Float32BufferAttribute(positions, 3));
  surface.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  surface.setIndex(triangles);
  surface.rotateX(Math.PI / 2); // wing-space y (toward the head) becomes model +Z; relief becomes up/down
  surface.computeVertexNormals();

  return { surface, edges: new EdgesGeometry(surface, EDGE_ANGLE_THRESHOLD_DEGREES) };
};
