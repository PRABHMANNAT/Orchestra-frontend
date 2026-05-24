import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { BrainNode } from "../brain.types";
import { sphericalToCartesian } from "../lib/sphericalToCartesian";
import { useReducedMotion } from "../lib/useReducedMotion";

type CameraControllerProps = {
  targetNode: BrainNode | null;
};

export function CameraController({ targetNode }: CameraControllerProps) {
  const ref = useRef<CameraControls>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const smooth = !reducedMotion;
    if (targetNode?.position) {
      const pinPosition = sphericalToCartesian(targetNode.position.lat, targetNode.position.lng, 1.52);
      const cameraPosition = pinPosition.clone().normalize().multiplyScalar(4.1);
      void ref.current.setLookAt(cameraPosition.x, cameraPosition.y, cameraPosition.z, 0, 0, 0, smooth);
      return;
    }

    void ref.current.setLookAt(0, 0, 5, 0, 0, 0, smooth);
  }, [reducedMotion, targetNode]);

  useEffect(() => {
    const handleZoom = (event: Event) => {
      const delta = (event as CustomEvent<number>).detail;
      void ref.current?.dolly(delta, true);
    };
    const handleReset = () => {
      void ref.current?.setLookAt(0, 0, 5, 0, 0, 0, !reducedMotion);
    };

    window.addEventListener("brain-camera-zoom", handleZoom);
    window.addEventListener("brain-camera-reset", handleReset);
    return () => {
      window.removeEventListener("brain-camera-zoom", handleZoom);
      window.removeEventListener("brain-camera-reset", handleReset);
    };
  }, [reducedMotion]);

  return <CameraControls ref={ref} minDistance={3} maxDistance={8} smoothTime={reducedMotion ? 0 : 0.7} draggingSmoothTime={0.05} dollyToCursor={false} truckSpeed={0} />;
}
