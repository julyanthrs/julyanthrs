import type { ReactNode } from 'react';

export type VisualVariant = 'ledger' | 'atelier' | 'synapse' | 'noir' | 'pocket';

export type VisualLayerName = 'back' | 'mid' | 'front';

export type VisualLayers = Record<VisualLayerName, ReactNode>;

/** Unique id factory so gradients never collide between instances. */
export type IdFactory = (name: string) => string;

export const VISUAL_VIEWBOX = { width: 1600, height: 1000 } as const;
