import { Canvas } from "@react-three/fiber";
import { Suspense, type ReactNode } from "react";
import { brainTokens } from "../tokens";

export function BrainScene({ children, onPointerMissed }: { children: ReactNode; onPointerMissed: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      className="h-full w-full"
      style={{ background: brainTokens.canvas }}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={[brainTokens.canvas]} />
      <ambientLight intensity={0.8} color="#FAF8F5" />
      <directionalLight position={[3, 4, 3]} intensity={0.6} color="#FFFFFF" />
      <pointLight position={[-4, -2, -3]} intensity={0.2} color="#B8543D" />
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
