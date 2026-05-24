import { Html } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { BrainCategory, BrainNode } from "../brain.types";
import { buildContinentTexture } from "../lib/buildContinentTexture";
import { sphericalToCartesian } from "../lib/sphericalToCartesian";
import { useBrainStore } from "../state/brainStore";
import { brainTokens } from "../tokens";

const CATEGORIES: BrainCategory[] = ["doc", "decision", "comms", "team", "change"];
const CATEGORY_LABEL: Record<BrainCategory, string> = {
  doc: "Docs",
  decision: "Decisions",
  comms: "Comms",
  team: "Team",
  change: "Changes"
};

function centroid(nodes: BrainNode[], category: BrainCategory) {
  const categoryNodes = nodes.filter((node) => node.category === category && node.position);
  if (!categoryNodes.length) {
    return null;
  }
  return {
    lat: categoryNodes.reduce((sum, node) => sum + node.position!.lat, 0) / categoryNodes.length,
    lng: categoryNodes.reduce((sum, node) => sum + node.position!.lng, 0) / categoryNodes.length
  };
}

export function ContinentLayer({ nodes }: { nodes: BrainNode[] }) {
  const texture = useMemo(() => buildContinentTexture(nodes), [nodes]);
  const selectedNode = useBrainStore((state) => state.selectedNode);
  const hoveredNode = useBrainStore((state) => state.hoveredNode);
  const activeFilter = useBrainStore((state) => state.activeFilter);

  return (
    <>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1.496, 64, 64]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.FrontSide} blending={THREE.NormalBlending} />
      </mesh>

      {CATEGORIES.map((category) => {
        const center = centroid(nodes, category);
        if (!center || selectedNode || hoveredNode) {
          return null;
        }
        const position = sphericalToCartesian(center.lat, center.lng, 1.82);
        const isMuted = activeFilter && activeFilter !== category;
        return (
          <Html key={category} position={position} center style={{ pointerEvents: "none" }}>
            <span
              className="font-mono text-[11px] font-medium uppercase leading-[1.3] tracking-[0.08em] transition-opacity"
              style={{ color: brainTokens.pin[category], opacity: isMuted ? 0.16 : 0.6 }}
            >
              {CATEGORY_LABEL[category]}
            </span>
          </Html>
        );
      })}
    </>
  );
}
