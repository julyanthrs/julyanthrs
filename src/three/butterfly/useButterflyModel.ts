import { useEffect, useMemo } from "react";
import { createButterflyModel, type ButterflyModel, type ButterflyQuality } from "./createButterflyModel";

/** Creates the butterfly rig once per quality level and frees its GPU resources on unmount. */
export const useButterflyModel = (quality: ButterflyQuality): ButterflyModel => {
  const model = useMemo(() => createButterflyModel(quality), [quality]);
  useEffect(() => () => model.dispose(), [model]);
  return model;
};
