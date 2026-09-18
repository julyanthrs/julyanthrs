export type Point2 = readonly [number, number];

interface Triangle {
  a: number;
  b: number;
  c: number;
  centerX: number;
  centerY: number;
  radiusSquared: number;
}

const circumscribe = (points: readonly Point2[], a: number, b: number, c: number): Triangle => {
  const [ax, ay] = points[a]!;
  const [bx, by] = points[b]!;
  const [cx, cy] = points[c]!;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return { a, b, c, centerX: 0, centerY: 0, radiusSquared: Number.POSITIVE_INFINITY };
  const aSq = ax * ax + ay * ay;
  const bSq = bx * bx + by * by;
  const cSq = cx * cx + cy * cy;
  const centerX = (aSq * (by - cy) + bSq * (cy - ay) + cSq * (ay - by)) / d;
  const centerY = (aSq * (cx - bx) + bSq * (ax - cx) + cSq * (bx - ax)) / d;
  return { a, b, c, centerX, centerY, radiusSquared: (ax - centerX) ** 2 + (ay - centerY) ** 2 };
};

/**
 * Bowyer–Watson Delaunay triangulation. O(n²), which is fine for the few hundred points of a
 * wing mesh built once at load. Returns a flat index list, three indices per triangle.
 */
export const triangulate = (input: readonly Point2[]): number[] => {
  const xs = input.map(([x]) => x);
  const ys = input.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  const midX = minX + span / 2;
  const midY = minY + span / 2;

  // A super-triangle that contains every input point; its vertices are removed at the end.
  const points: Point2[] = [...input, [midX - 20 * span, midY - span], [midX, midY + 20 * span], [midX + 20 * span, midY - span]];
  const superStart = input.length;
  let triangles: Triangle[] = [circumscribe(points, superStart, superStart + 1, superStart + 2)];

  for (let index = 0; index < input.length; index += 1) {
    const [px, py] = points[index]!;
    const bad: Triangle[] = [];
    const kept: Triangle[] = [];
    for (const triangle of triangles) {
      if ((px - triangle.centerX) ** 2 + (py - triangle.centerY) ** 2 < triangle.radiusSquared) bad.push(triangle);
      else kept.push(triangle);
    }

    // The hole's boundary is every edge that belongs to exactly one bad triangle.
    const edgeCounts = new Map<string, [number, number, number]>();
    for (const { a, b, c } of bad) {
      for (const [from, to] of [[a, b], [b, c], [c, a]] as const) {
        const key = from < to ? `${from}:${to}` : `${to}:${from}`;
        const existing = edgeCounts.get(key);
        edgeCounts.set(key, existing ? [existing[0], existing[1], existing[2] + 1] : [from, to, 1]);
      }
    }
    for (const [from, to, count] of edgeCounts.values()) {
      if (count === 1) kept.push(circumscribe(points, from, to, index));
    }
    triangles = kept;
  }

  return triangles.filter(({ a, b, c }) => a < superStart && b < superStart && c < superStart).flatMap(({ a, b, c }) => [a, b, c]);
};

/** Even–odd rule point-in-polygon test. */
export const isInsidePolygon = (x: number, y: number, polygon: readonly Point2[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
