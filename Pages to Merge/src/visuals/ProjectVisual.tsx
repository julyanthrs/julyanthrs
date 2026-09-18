import { memo, useId, useMemo } from 'react';
import { SCENES } from './scenes';
import { VISUAL_VIEWBOX, type VisualLayerName, type VisualVariant } from './types';

interface ProjectVisualProps {
  variant: VisualVariant;
  /** Accessible description of the artwork */
  label: string;
  className?: string;
  /**
   * Renders back/mid/front as separate absolutely-positioned SVGs tagged with
   * `data-layer`, so a parent can move them independently for depth effects.
   */
  layered?: boolean;
}

const LAYER_ORDER: readonly VisualLayerName[] = ['back', 'mid', 'front'];
const VIEWBOX = `0 0 ${VISUAL_VIEWBOX.width} ${VISUAL_VIEWBOX.height}`;

const useSafeId = (): string => useId().replace(/[^a-zA-Z0-9]/g, '');

function ProjectVisualComponent({ variant, label, className = '', layered = false }: ProjectVisualProps) {
  const baseId = useSafeId();

  const flatScene = useMemo(() => (layered ? null : SCENES[variant]((name) => `${baseId}-${name}`)), [baseId, layered, variant]);

  const layerScenes = useMemo(
    () => (layered ? LAYER_ORDER.map((layer) => ({ layer, scene: SCENES[variant]((name) => `${baseId}-${layer}-${name}`) })) : []),
    [baseId, layered, variant],
  );

  if (flatScene) {
    return (
      <svg
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={label}
        className={`block h-full w-full ${className}`}
      >
        <defs>{flatScene.defs}</defs>
        {flatScene.layers.back}
        {flatScene.layers.mid}
        {flatScene.layers.front}
      </svg>
    );
  }

  return (
    <div role="img" aria-label={label} className={`relative h-full w-full ${className}`}>
      {layerScenes.map(({ layer, scene }) => (
        <svg
          key={layer}
          data-layer={layer}
          viewBox={VIEWBOX}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full will-change-transform"
        >
          <defs>{scene.defs}</defs>
          {scene.layers[layer]}
        </svg>
      ))}
    </div>
  );
}

export const ProjectVisual = memo(ProjectVisualComponent);
