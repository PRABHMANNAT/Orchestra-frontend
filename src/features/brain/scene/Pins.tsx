import type { BrainNode } from "../brain.types";
import { Pin } from "./Pin";

export function Pins({ nodes }: { nodes: BrainNode[] }) {
  return (
    <group>
      {nodes.map((node) => (
        <Pin key={node.id} node={node} />
      ))}
    </group>
  );
}
