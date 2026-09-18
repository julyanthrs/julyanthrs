import type { Material } from "three";

export interface BendUniform {
  value: number;
}

/**
 * Bends a wing along its span on the GPU (tips curl up or down by `bend * x²`), so the outer
 * wing lags the stroke like a real membrane. Flat-shaded facet normals come from screen-space
 * derivatives, so the bent facets re-light correctly without any CPU work.
 */
export const applyWingBend = (material: Material, bend: BendUniform, cacheKey: string): void => {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWingBend = bend;
    shader.vertexShader = `uniform float uWingBend;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n  transformed.y += uWingBend * transformed.x * transformed.x;",
    );
  };
  material.customProgramCacheKey = () => cacheKey;
};
