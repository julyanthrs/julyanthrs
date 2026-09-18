import { Shape } from "three";

/**
 * Wing outlines in "wing space": x runs outward from the hinge, y runs toward the head.
 * The hinge sits at the origin so each wing can rotate about the body axis.
 */
export const createForewingShape = (): Shape => {
  const shape = new Shape();
  shape.moveTo(0.02, 0.06);
  shape.bezierCurveTo(0.25, 0.32, 0.62, 0.62, 0.98, 0.58); // leading edge to apex
  shape.bezierCurveTo(1.07, 0.46, 0.99, 0.22, 0.86, 0.05); // outer margin
  shape.bezierCurveTo(0.66, -0.07, 0.34, -0.09, 0.06, -0.04); // trailing edge back to hinge
  shape.closePath();
  return shape;
};

export const createHindwingShape = (): Shape => {
  const shape = new Shape();
  shape.moveTo(0.04, -0.02);
  shape.bezierCurveTo(0.34, 0.02, 0.72, -0.08, 0.8, -0.3);
  shape.bezierCurveTo(0.87, -0.52, 0.63, -0.78, 0.41, -0.84); // rounded lobe
  shape.bezierCurveTo(0.31, -0.98, 0.2, -1.03, 0.16, -0.95); // tail
  shape.bezierCurveTo(0.12, -0.72, 0.06, -0.4, 0.02, -0.12);
  shape.closePath();
  return shape;
};

export interface ShapeBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const OUTLINE_SAMPLES = 160;

export const getShapeBounds = (shape: Shape): ShapeBounds => {
  const points = shape.getSpacedPoints(OUTLINE_SAMPLES);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
};
