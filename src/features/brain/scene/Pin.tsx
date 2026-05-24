import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { BrainNode } from "../brain.types";
import { sphericalToCartesian } from "../lib/sphericalToCartesian";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useBrainStore } from "../state/brainStore";
import { brainTokens } from "../tokens";

type PinProps = {
  node: BrainNode;
};

function getCategoryLabel(category: BrainNode["category"]) {
  return category === "doc" ? "doc" : category;
}

function truncateTitle(title: string) {
  return title.length > 28 ? `${title.slice(0, 25)}...` : title;
}

export function Pin({ node }: PinProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();
  const hoveredNode = useBrainStore((state) => state.hoveredNode);
  const selectedNode = useBrainStore((state) => state.selectedNode);
  const matchesFilter = useBrainStore((state) => state.matchesFilter(node));
  const setHovered = useBrainStore((state) => state.setHovered);
  const selectNode = useBrainStore((state) => state.selectNode);

  const hovered = hoveredNode?.id === node.id;
  const selected = selectedNode?.id === node.id;
  const color = brainTokens.pin[node.category];
  const baseOpacity = matchesFilter ? (selectedNode && !selected ? 0.2 : 1) : selectedNode ? 0.14 : 0.1;

  const surfacePosition = useMemo(() => sphericalToCartesian(node.position?.lat ?? 0, node.position?.lng ?? 0, 1.52), [node.position?.lat, node.position?.lng]);
  const pinPosition = useMemo(() => surfacePosition.clone().normalize().multiplyScalar(1.55), [surfacePosition]);
  const liftPoints = useMemo(() => [surfacePosition.clone().normalize().multiplyScalar(1.51), pinPosition.clone()], [pinPosition, surfacePosition]);

  useFrame(({ clock }) => {
    if (!coreRef.current || !haloRef.current) {
      return;
    }
    const pulse = node.featured && !reducedMotion ? 1 + Math.sin(clock.elapsedTime * 1.6) * 0.08 : 1;
    coreRef.current.scale.setScalar(selected ? 1.8 : hovered ? 1.6 : pulse);
    haloRef.current.scale.setScalar(hovered || selected ? 1.45 : 1);
  });

  return (
    <group position={pinPosition} frustumCulled>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={liftPoints.length}
            array={new Float32Array(liftPoints.flatMap((point) => [point.x - pinPosition.x, point.y - pinPosition.y, point.z - pinPosition.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3 * baseOpacity} />
      </line>

      <mesh ref={haloRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={(hovered || selected ? 0.5 : 0.2) * baseOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh
        ref={coreRef}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(node);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(event) => {
          event.stopPropagation();
          selectNode(node);
        }}
      >
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={baseOpacity} />
      </mesh>

      {hovered && !selected && (
        <Html distanceFactor={6} center style={{ pointerEvents: "none" }}>
          <div className="w-[180px] rounded-lg border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-2.5 py-2 text-left shadow-[0_2px_12px_rgba(26,22,18,0.10)]">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: `${color}B3` }}>
              {getCategoryLabel(node.category)}
            </div>
            <div className="mt-1 font-sans text-[13px] font-medium leading-[1.3] text-[#1A1612]">{truncateTitle(node.title)}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
