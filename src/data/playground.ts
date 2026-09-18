import type { Experiment } from "./types";

export const playgroundIntro = "Small experiments where design, interaction, and code collide.";

export const experiments: readonly Experiment[] = [
  { id: "geometry", title: "Interactive 3D geometry", hint: "Drag to rotate", span: 2 },
  { id: "particles", title: "Particle field", hint: "Move to attract, click to repel", span: 1 },
  { id: "liquid", title: "Liquid cursor", hint: "Move quickly through the frame", span: 1 },
  { id: "kinetic", title: "Kinetic type", hint: "Hover the letters", span: 2 },
  { id: "physics", title: "Physics objects", hint: "Grab and throw the shapes", span: 1 },
  { id: "distortion", title: "Image distortion", hint: "Sweep across the image", span: 1 },
  { id: "magnetic", title: "Magnetic UI", hint: "Bring the cursor close", span: 1 },
  { id: "grid", title: "Generative grid", hint: "Steer the grid with your pointer", span: 1 },
];
