import { MathUtils, Vector3, type PerspectiveCamera } from "three";

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const ray = new Vector3();

/** World-space half height of the view at `depth` units in front of an unrotated camera. */
export const halfHeightAtDepth = (camera: PerspectiveCamera, depth: number): number =>
  depth * Math.tan(MathUtils.degToRad(camera.fov) / 2);

/** On-screen pixels per world unit at `depth`, for a canvas of `canvasHeight` pixels. */
export const pixelsPerWorldUnit = (camera: PerspectiveCamera, depth: number, canvasHeight: number): number =>
  canvasHeight / (2 * halfHeightAtDepth(camera, depth));

/**
 * The world point under a viewport pixel, `depth` units in front of the camera.
 * Assumes the camera looks down -Z without rotation, which both butterfly scenes use.
 */
export const worldPointAtScreen = (
  camera: PerspectiveCamera,
  rect: ViewportRect,
  clientX: number,
  clientY: number,
  depth: number,
  out: Vector3,
): Vector3 => {
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
  return out.copy(camera.position).addScaledVector(ray, depth / -ray.z);
};

/** Keeps a point inside the visible frustum at its own depth, leaving `margin` units of room on every side. */
export const clampToView = (camera: PerspectiveCamera, point: Vector3, margin: number): Vector3 => {
  const depth = Math.max(camera.near * 2, camera.position.z - point.z);
  const halfHeight = Math.max(0, halfHeightAtDepth(camera, depth) - margin);
  const halfWidth = Math.max(0, halfHeightAtDepth(camera, depth) * camera.aspect - margin);
  point.x = MathUtils.clamp(point.x, camera.position.x - halfWidth, camera.position.x + halfWidth);
  point.y = MathUtils.clamp(point.y, camera.position.y - halfHeight, camera.position.y + halfHeight);
  return point;
};
