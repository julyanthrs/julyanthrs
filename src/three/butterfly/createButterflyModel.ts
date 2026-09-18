import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from "three";
import { applyWingBend, type BendUniform } from "./wingBend";
import { createFacetedWing } from "./wingGeometry";
import { createForewingShape, createHindwingShape, getShapeBounds } from "./wingShapes";
import { createWingTextures, type WingPattern } from "./wingTexture";

export type ButterflyQuality = "low" | "high";

/** One animation frame of the rig, produced by the flight model. */
export interface WingPose {
  fore: number;
  hind: number;
  /** Feathering about the wing's span axis (radians). */
  twist: number;
  /** Spanwise curl of the wing membrane; positive curls the tips up. */
  bend: number;
  /** Vertical body offset in model units. */
  bob: number;
  /** Nose up or down (radians). */
  pitch: number;
  /** Abdomen swing (radians). */
  abdomen: number;
  /** Antenna sway (radians). */
  antenna: number;
}

export interface ButterflyModel {
  /** Controllers set position, quaternion and scale on this group. */
  root: Group;
  applyPose: (pose: WingPose) => void;
  /** Writes the world positions of the four wingtips (for sparkle emitters). */
  getWingtips: (out: Vector3[]) => Vector3[];
  dispose: () => void;
}

/** Tip to tip across the forewings, in model units. Controllers use this to size the butterfly. */
export const MODEL_WINGSPAN = 2.45;

const WING_SCALE = 1.2;
const HINDWING_DROP = -0.006;
const HINDWING_BEND_LAG = 1.2;
const HINGE = { fore: new Vector3(0.05, 0.02, 0.02), hind: new Vector3(0.045, 0.012, -0.035) } as const;
const TIP = { fore: new Vector3(0.98, 0, 0.58), hind: new Vector3(0.16, 0, -0.95) } as const;

const QUALITY = {
  high: { textureSize: 1024, facetSpacing: 0.07, relief: 0.02 },
  low: { textureSize: 512, facetSpacing: 0.11, relief: 0.018 },
} as const;

const COLORS = {
  glow: new Color("#ff5aa5"),
  sheen: new Color("#ffc4e0"),
  lattice: new Color("#ffd9ec"),
  body: new Color("#4a0f2c"),
  bodyGlow: new Color("#ff2e88"),
  antenna: new Color("#2a0a1c"),
  tip: new Color("#ff8cc4"),
} as const;

const FOREWING_PATTERN: WingPattern = {
  veinCount: 9,
  discalCell: { x: 0.26, y: 0.16 },
  apexPatch: { x: 0.86, y: 0.5, radius: 0.12 },
};
const HINDWING_PATTERN: WingPattern = {
  veinCount: 8,
  discalCell: { x: 0.22, y: -0.24 },
  eyespot: { x: 0.53, y: -0.52, radius: 0.14 },
};

/** Glassy, iridescent wing surface. Flat shading lets each facet flash independently. */
const createCrystalWingMaterial = (textures: { map: Texture; glowMap: Texture }, quality: ButterflyQuality) =>
  new MeshPhysicalMaterial({
    map: textures.map,
    emissive: COLORS.glow,
    emissiveMap: textures.glowMap,
    emissiveIntensity: 1.05,
    roughness: 0.07,
    metalness: 0.08,
    ior: 2.1,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    iridescence: 1,
    iridescenceIOR: 1.45,
    iridescenceThicknessRange: [120, 900],
    sheen: quality === "high" ? 0.35 : 0,
    sheenColor: COLORS.sheen,
    // Transparency scales highlights too, so reflections are a touch stronger to keep facets flashing through the panes.
    envMapIntensity: 2,
    flatShading: true,
    transparent: true,
    // See-through wings must not hide each other: sorting relies on renderOrder (hindwings first).
    depthWrite: false,
    side: DoubleSide,
  });

/**
 * Procedural crystal butterfly. Model space: body along +Z (head forward), wings along ±X, up +Y.
 * Wings hinge about the body axis and bend along their span in the vertex shader.
 */
export const createButterflyModel = (quality: ButterflyQuality): ButterflyModel => {
  const settings = QUALITY[quality];
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const keepGeometry = <T extends BufferGeometry>(geometry: T): T => (geometries.push(geometry), geometry);
  const keepMaterial = <T extends Material>(material: T): T => (materials.push(material), material);

  const buildWing = (shape: ReturnType<typeof createForewingShape>, pattern: WingPattern, seed: number, bend: BendUniform, key: string) => {
    const bounds = getShapeBounds(shape);
    const facets = createFacetedWing(shape, bounds, { spacing: settings.facetSpacing, relief: settings.relief, seed });
    const wingTextures = createWingTextures(shape, bounds, pattern, settings.textureSize);
    textures.push(wingTextures.map, wingTextures.glowMap);
    const surfaceMaterial = keepMaterial(createCrystalWingMaterial(wingTextures, quality));
    applyWingBend(surfaceMaterial, bend, `${key}-surface`);
    const latticeMaterial = keepMaterial(
      new LineBasicMaterial({ color: COLORS.lattice, transparent: true, opacity: 0.12, blending: AdditiveBlending, depthWrite: false }),
    );
    applyWingBend(latticeMaterial, bend, `${key}-lattice`);
    return {
      surface: keepGeometry(facets.surface),
      edges: keepGeometry(facets.edges),
      surfaceMaterial,
      latticeMaterial,
    };
  };

  const foreBend: BendUniform = { value: 0 };
  const hindBend: BendUniform = { value: 0 };
  const forewing = buildWing(createForewingShape(), FOREWING_PATTERN, 11, foreBend, "forewing");
  const hindwing = buildWing(createHindwingShape(), HINDWING_PATTERN, 23, hindBend, "hindwing");

  const root = new Group();
  const visual = new Group();
  root.add(visual);

  const pivots: Group[] = [];
  const tipLocators: Object3D[] = [];
  const buildSide = (mirrored: boolean) => {
    const side = new Group();
    if (mirrored) side.scale.x = -1;
    const addWing = (wing: typeof forewing, hinge: Vector3, tip: Vector3, drop: number, renderOrder: number) => {
      const pivot = new Group();
      pivot.position.copy(hinge);
      pivot.rotation.order = "ZYX"; // feather about the span first, then flap about the body axis
      const holder = new Group();
      holder.scale.setScalar(WING_SCALE);
      holder.position.y = drop;
      const surface = new Mesh(wing.surface, wing.surfaceMaterial);
      surface.renderOrder = renderOrder;
      const lattice = new LineSegments(wing.edges, wing.latticeMaterial);
      lattice.renderOrder = renderOrder + 1;
      const locator = new Object3D();
      locator.position.copy(tip);
      holder.add(surface, lattice, locator);
      pivot.add(holder);
      side.add(pivot);
      pivots.push(pivot);
      tipLocators.push(locator);
    };
    addWing(hindwing, HINGE.hind, TIP.hind, HINDWING_DROP, 1);
    addWing(forewing, HINGE.fore, TIP.fore, 0, 3);
    visual.add(side);
  };
  buildSide(false);
  buildSide(true);

  const bodyMaterial = keepMaterial(
    new MeshPhysicalMaterial({
      color: COLORS.body,
      emissive: COLORS.bodyGlow,
      emissiveIntensity: 0.12,
      metalness: 0.35,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 0.7,
      iridescenceThicknessRange: [200, 700],
      envMapIntensity: 1.8,
      flatShading: true,
    }),
  );
  const crystal = (radius: number, detail: number) => keepGeometry(new IcosahedronGeometry(radius, detail));
  const addCrystal = (parent: Object3D, geometry: BufferGeometry, position: [number, number, number], scale: [number, number, number]) => {
    const mesh = new Mesh(geometry, bodyMaterial);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  };

  addCrystal(visual, crystal(0.07, 1), [0, 0, 0], [0.9, 0.85, 1.35]); // thorax
  addCrystal(visual, crystal(0.056, 1), [0, 0.01, 0.13], [1, 1, 1]); // head

  const abdomen = new Group();
  abdomen.position.z = -0.08;
  visual.add(abdomen);
  const segment = crystal(0.05, 0);
  [0, 1, 2, 3, 4].forEach((index) => {
    const taper = 1 - index * 0.14;
    addCrystal(abdomen, segment, [0, 0, -0.06 - index * 0.085], [taper, taper, 1.25]);
  });

  const antennaMaterial = keepMaterial(new MeshStandardMaterial({ color: COLORS.antenna, roughness: 0.35, metalness: 0.4 }));
  const tipMaterial = keepMaterial(new MeshStandardMaterial({ color: COLORS.tip, emissive: COLORS.tip, emissiveIntensity: 2 }));
  const tipGeometry = keepGeometry(new SphereGeometry(0.02, 10, 8));
  const antennae = [1, -1].map((direction) => {
    const antenna = new Group();
    antenna.position.set(0.016 * direction, 0.035, 0.16);
    const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.07 * direction, 0.14, 0.2), new Vector3(0.16 * direction, 0.18, 0.36)]);
    antenna.add(new Mesh(keepGeometry(new TubeGeometry(curve, 14, 0.006, 5)), antennaMaterial));
    const tip = new Mesh(tipGeometry, tipMaterial);
    tip.position.copy(curve.getPoint(1));
    antenna.add(tip);
    visual.add(antenna);
    return antenna;
  });

  const applyPose = (pose: WingPose) => {
    pivots.forEach((pivot, index) => {
      const isHind = index % 2 === 0;
      pivot.rotation.set(isHind ? pose.twist * 0.7 : pose.twist, 0, isHind ? pose.hind : pose.fore);
    });
    foreBend.value = pose.bend;
    hindBend.value = pose.bend * HINDWING_BEND_LAG;
    visual.position.y = pose.bob;
    visual.rotation.x = pose.pitch;
    abdomen.rotation.x = pose.abdomen;
    antennae.forEach((antenna, index) => {
      antenna.rotation.x = pose.antenna * (index === 0 ? 1 : 0.85);
    });
  };

  const getWingtips = (out: Vector3[]) => {
    root.updateMatrixWorld();
    tipLocators.forEach((locator, index) => {
      const target = out[index];
      if (target) locator.getWorldPosition(target);
    });
    return out;
  };

  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  };

  return { root, applyPose, getWingtips, dispose };
};
