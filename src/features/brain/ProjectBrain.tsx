import type { BrainData } from "./brain.types";
import { BrainOverlay } from "./overlay/BrainOverlay";
import { DetailPanel } from "./panel/DetailPanel";
import { Atmosphere } from "./scene/Atmosphere";
import { BrainSphere } from "./scene/BrainSphere";
import { CameraController } from "./scene/CameraController";
import { BrainScene } from "./scene/BrainScene";
import { NodeList } from "./sidebar/NodeList";
import { useBrainStore } from "./state/brainStore";

export function ProjectBrain({ data }: { data: BrainData }) {
  const selectedNode = useBrainStore((state) => state.selectedNode);
  const clearSelection = useBrainStore((state) => state.clearSelection);
  const searchQuery = useBrainStore((state) => state.searchQuery);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#FAF8F5] text-[#1A1612]" role="region" aria-label="Project brain knowledge sphere">
      <BrainOverlay data={data} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <NodeList data={data} />
        <div className="relative min-w-0 flex-1 transition-[width,opacity] duration-300 ease-out" style={{ opacity: searchQuery ? 0.85 : 1 }}>
          <BrainScene onPointerMissed={clearSelection}>
            <BrainSphere nodes={data.nodes} />
            <Atmosphere />
            <CameraController targetNode={selectedNode} />
          </BrainScene>
        </div>
        <DetailPanel data={data} />
      </div>
    </div>
  );
}
