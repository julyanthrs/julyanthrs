import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const ENVIRONMENT_BLUR = 0.04;

/**
 * Procedural studio reflections for chrome materials, generated once on the GPU.
 * Avoids shipping an HDR texture while still giving metals something to reflect.
 */
export const useStudioEnvironment = (): void => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, ENVIRONMENT_BLUR);
    scene.environment = target.texture;
    room.dispose();
    generator.dispose();

    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene]);
};
