import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type WheelEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckSquareIcon,
  CloseIcon,
  FileTextIcon,
  GitBranchIcon,
  GripHorizontalIcon,
  Grid2x2Icon,
  LockIcon,
  LockOpenIcon,
  MaximizeIcon,
  SparklesIcon,
  ZoomInIcon,
  ZoomOutIcon
} from "../components/ui/AppIcons";
import { getFlowGraph, getProjects } from "../lib/api";
import type { FlowEdge, FlowGraph, FlowNode } from "../lib/types";

type Point = {
  x: number;
  y: number;
};

type NodePositions = Record<string, Point>;

type CanvasSize = {
  width: number;
  height: number;
};

const worldWidth = 1400;
const worldHeight = 900;
const nodeWidth = 200;
const edgeAnchorX = 100;
const edgeAnchorY = 40;
const detailPanelWidth = 360;
const miniMapWidth = 160;
const miniMapHeight = 100;

const typeStyles: Record<
  FlowNode["type"],
  {
    bg: string;
    border: string;
    accent: string;
    tagBg: string;
    tagText: string;
  }
> = {
  flow: {
    bg: "#FFFFFF",
    border: "rgba(26,22,18,0.08)",
    accent: "#2D4A3E",
    tagBg: "rgba(45,74,62,0.10)",
    tagText: "#2D4A3E"
  },
  module: {
    bg: "#FFFFFF",
    border: "rgba(26,22,18,0.08)",
    accent: "#8B7FD4",
    tagBg: "rgba(139,127,212,0.12)",
    tagText: "#8B7FD4"
  },
  integration: {
    bg: "#FFFFFF",
    border: "rgba(26,22,18,0.08)",
    accent: "#5A5450",
    tagBg: "rgba(120,113,108,0.10)",
    tagText: "#5A5450"
  },
  approval: {
    bg: "#FFFFFF",
    border: "rgba(26,22,18,0.08)",
    accent: "#8C5D1E",
    tagBg: "rgba(194,136,64,0.12)",
    tagText: "#8C5D1E"
  },
  unresolved: {
    bg: "#FFFFFF",
    border: "rgba(26,22,18,0.08)",
    accent: "#9E3B2E",
    tagBg: "rgba(158,59,46,0.10)",
    tagText: "#9E3B2E"
  }
};

const statusStyles: Record<
  FlowNode["status"],
  {
    dot: string;
    pillBg: string;
    pillText: string;
  }
> = {
  critical: {
    dot: "#9E3B2E",
    pillBg: "rgba(158,59,46,0.10)",
    pillText: "#9E3B2E"
  },
  "at-risk": {
    dot: "#8C5D1E",
    pillBg: "rgba(194,136,64,0.12)",
    pillText: "#8C5D1E"
  },
  stable: {
    dot: "#2D4A3E",
    pillBg: "rgba(45,74,62,0.10)",
    pillText: "#2D4A3E"
  },
  unresolved: {
    dot: "#9E3B2E",
    pillBg: "rgba(158,59,46,0.10)",
    pillText: "#9E3B2E"
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatNodeId(id: string) {
  const match = id.match(/^n(\d+)$/i);
  if (!match) {
    return id;
  }

  return `N-${match[1].padStart(2, "0")}`;
}

function getTypeLabel(type: FlowNode["type"]) {
  return type.replace("-", " ");
}

function getStatusLabel(status: FlowNode["status"]) {
  return status;
}

function buildNodePositions(nodes: FlowNode[]): NodePositions {
  return Object.fromEntries(nodes.map((node) => [node.id, { ...node.position }]));
}

function getFitViewport(canvasSize: CanvasSize) {
  const padding = 80;
  const zoom = clamp(Math.min((canvasSize.width - padding) / worldWidth, (canvasSize.height - padding) / worldHeight), 0.5, 2);

  return {
    zoom,
    pan: {
      x: (canvasSize.width - worldWidth * zoom) / 2,
      y: (canvasSize.height - worldHeight * zoom) / 2
    }
  };
}

function getNodeIcon(type: FlowNode["type"], className = "h-4 w-4") {
  if (type === "flow") {
    return <SparklesIcon className={className} />;
  }

  if (type === "module") {
    return <Grid2x2Icon className={className} />;
  }

  if (type === "integration") {
    return <GitBranchIcon className={className} />;
  }

  if (type === "approval") {
    return <CheckSquareIcon className={className} />;
  }

  return <AlertCircleIcon className={className} />;
}

function getBezierMidpoint(
  startX: number,
  startY: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  endX: number,
  endY: number
) {
  const t = 0.5;
  const omt = 1 - t;

  return {
    x: omt ** 3 * startX + 3 * omt ** 2 * t * c1x + 3 * omt * t ** 2 * c2x + t ** 3 * endX,
    y: omt ** 3 * startY + 3 * omt ** 2 * t * c1y + 3 * omt * t ** 2 * c2y + t ** 3 * endY
  };
}

export function ProjectFlowchartPage() {
  const navigate = useNavigate();
  const { id = "1" } = useParams();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const initializedViewportRef = useRef(false);
  const panAnchorRef = useRef<Point>({ x: 0, y: 0 });
  const dragBaseRef = useRef<Record<string, Point>>({});
  const dragDistanceRef = useRef<Record<string, number>>({});

  const [projectName, setProjectName] = useState("PROJECT");
  const [graph, setGraph] = useState<FlowGraph | null>(null);
  const [nodePositions, setNodePositions] = useState<NodePositions>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [dragLocked, setDragLocked] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      const [projects, flowGraph] = await Promise.all([getProjects(), getFlowGraph(id)]);
      if (isCancelled) {
        return;
      }

      const project = projects.find((item) => item.id === id) ?? projects[0];
      setProjectName(project?.name ?? "PROJECT");
      setGraph(flowGraph);
      setNodePositions(buildNodePositions(flowGraph.nodes));
      setSelectedNodeId(null);
      initializedViewportRef.current = false;
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      setCanvasSize({
        width: rect.width,
        height: rect.height
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!graph || canvasSize.width === 0 || canvasSize.height === 0 || initializedViewportRef.current) {
      return;
    }

    const viewport = getFitViewport(canvasSize);
    setPan(viewport.pan);
    setZoom(viewport.zoom);
    initializedViewportRef.current = true;
  }, [canvasSize, graph]);

  useEffect(() => {
    if (!isPanning) {
      return;
    }

    const handleMove = (event: globalThis.MouseEvent) => {
      const nextPoint = { x: event.clientX, y: event.clientY };
      const deltaX = nextPoint.x - panAnchorRef.current.x;
      const deltaY = nextPoint.y - panAnchorRef.current.y;

      panAnchorRef.current = nextPoint;
      setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
    };

    const handleUp = () => {
      setIsPanning(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning]);

  const selectedNode = useMemo(() => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null, [graph, selectedNodeId]);

  const nodeMap = useMemo(() => new Map(graph?.nodes.map((node) => [node.id, node]) ?? []), [graph]);

  const connections = useMemo(() => {
    if (!selectedNode || !graph) {
      return [];
    }

    return graph.edges
      .filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id)
      .map((edge) => {
        const otherNodeId = edge.from === selectedNode.id ? edge.to : edge.from;
        return {
          edge,
          node: nodeMap.get(otherNodeId) ?? null
        };
      })
      .filter((item): item is { edge: FlowEdge; node: FlowNode } => item.node !== null);
  }, [graph, nodeMap, selectedNode]);

  const visibleViewport = useMemo(() => {
    const visibleWidth = Math.max(canvasSize.width - (selectedNode ? detailPanelWidth : 0), 0);

    return {
      x: clamp(-pan.x / zoom, 0, worldWidth),
      y: clamp(-pan.y / zoom, 0, worldHeight),
      width: clamp(visibleWidth / zoom, 0, worldWidth),
      height: clamp(canvasSize.height / zoom, 0, worldHeight)
    };
  }, [canvasSize.height, canvasSize.width, pan.x, pan.y, selectedNode, zoom]);

  const handleCanvasMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    setIsPanning(true);
    panAnchorRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((current) => clamp(current + (event.deltaY < 0 ? 0.1 : -0.1), 0.5, 2));
  };

  const handleDragStart = (nodeId: string) => {
    dragBaseRef.current[nodeId] = nodePositions[nodeId];
    dragDistanceRef.current[nodeId] = 0;
  };

  const handleDrag = (nodeId: string, info: PanInfo) => {
    const base = dragBaseRef.current[nodeId] ?? nodePositions[nodeId];
    dragDistanceRef.current[nodeId] = (dragDistanceRef.current[nodeId] ?? 0) + Math.abs(info.delta.x) + Math.abs(info.delta.y);

    setNodePositions((current) => ({
      ...current,
      [nodeId]: {
        x: base.x + info.offset.x / zoom,
        y: base.y + info.offset.y / zoom
      }
    }));
  };

  const handleDragEnd = (nodeId: string) => {
    delete dragBaseRef.current[nodeId];
  };

  const handleNodeClick = (nodeId: string) => {
    if ((dragDistanceRef.current[nodeId] ?? 0) > 4) {
      dragDistanceRef.current[nodeId] = 0;
      return;
    }

    setSelectedNodeId(nodeId);
  };

  const handleFitView = () => {
    const viewport = getFitViewport(canvasSize);
    setPan(viewport.pan);
    setZoom(viewport.zoom);
  };

  return (
    <section className="relative h-full overflow-hidden bg-bg">
      <div className="absolute inset-x-0 top-0 z-20 flex h-[52px] items-center border-b border-[rgba(0,0,0,0.06)] bg-[rgba(248,248,245,0.9)] px-7">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[#78716C] transition-colors hover:text-[#1A1612]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <span className="mx-4 h-4 w-px bg-[rgba(26,22,18,0.08)]" />
          <p className="truncate font-sans text-[15px] text-[#1A1612]">{projectName}</p>
          <span className="mx-2 font-sans text-[13px] text-[rgba(120,113,108,0.6)]">/</span>
          <p className="font-sans text-[12px] tracking-[0.12em] text-[#B8543D]">Flowchart</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {([
            ["Flow", "#B8543D"],
            ["Module", "#8B7FD4"],
            ["Integration", "#5A5450"],
            ["Approval", "#8C5D1E"],
            ["Unresolved", "#9E3B2E"]
          ] as const).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="font-sans text-[10px] tracking-[0.1em] text-[#78716C]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
        className={["absolute inset-x-0 bottom-0 top-[52px] overflow-hidden", isPanning ? "cursor-grabbing" : "cursor-grab"].join(" ")}
      >
        {graph ? (
          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: worldWidth,
              height: worldHeight,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0"
            }}
          >
            <svg width={worldWidth} height={worldHeight} className="absolute inset-0 z-[1] overflow-visible">
              {graph.edges.map((edge, index) => {
                const from = nodePositions[edge.from];
                const to = nodePositions[edge.to];
                if (!from || !to) {
                  return null;
                }

                const startX = from.x + edgeAnchorX;
                const startY = from.y + edgeAnchorY;
                const endX = to.x + edgeAnchorX;
                const endY = to.y + edgeAnchorY;
                const dx = to.x - from.x;
                const c1x = from.x + dx * 0.5 + edgeAnchorX;
                const c1y = from.y + edgeAnchorY;
                const c2x = to.x - dx * 0.5 + edgeAnchorX;
                const c2y = to.y + edgeAnchorY;
                const midpoint = getBezierMidpoint(startX, startY, c1x, c1y, c2x, c2y, endX, endY);
                const emphasized = hoveredNodeId ? edge.from === hoveredNodeId || edge.to === hoveredNodeId : false;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`}
                      fill="none"
                      stroke={edge.style === "solid" ? "#B8543D" : "#B8543D"}
                      strokeWidth={1.5}
                      strokeDasharray={edge.style === "dashed" ? "6 4" : undefined}
                      strokeLinecap="round"
                      opacity={emphasized ? 1 : edge.style === "solid" ? 0.35 : 0.5}
                    />

                    <motion.path
                      d={`M ${startX} ${startY} C ${c1x} ${c1y} ${c2x} ${c2y} ${endX} ${endY}`}
                      fill="none"
                      stroke={edge.style === "solid" ? "#B8543D" : "#B8543D"}
                      strokeWidth={1.5}
                      strokeDasharray={1000}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 1000, opacity: 1 }}
                      animate={{ strokeDashoffset: 0, opacity: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {edge.label ? (
                      <text
                        x={midpoint.x}
                        y={midpoint.y - 8}
                        textAnchor="middle"
                        className="font-mono text-[10px] fill-[rgba(120,113,108,0.6)]"
                        style={{ opacity: emphasized ? 1 : 0.92 }}
                      >
                        {edge.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {graph.nodes.map((node, index) => {
              const position = nodePositions[node.id];
              const typeStyle = typeStyles[node.type];
              const statusStyle = statusStyles[node.status];

              if (!position) {
                return null;
              }

              return (
                <motion.div
                  key={node.id}
                  drag={!dragLocked}
                  dragMomentum={false}
                  dragElastic={0}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    scale: { type: "spring", stiffness: 260, damping: 20, delay: index * 0.08 },
                    opacity: { duration: 0.22, delay: index * 0.08 }
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "none"
                  }}
                  className="pointer-events-auto absolute z-[2]"
                  style={{ left: position.x, top: position.y, width: nodeWidth }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    dragDistanceRef.current[node.id] = 0;
                  }}
                  onDragStart={() => handleDragStart(node.id)}
                  onDrag={(_, info) => handleDrag(node.id, info)}
                  onDragEnd={() => handleDragEnd(node.id)}
                  onHoverStart={() => setHoveredNodeId(node.id)}
                  onHoverEnd={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                  onClick={() => handleNodeClick(node.id)}
                >
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: typeStyle.bg,
                      border: `1.5px solid ${hoveredNodeId === node.id ? typeStyle.accent : typeStyle.border}`,
                      boxShadow: "none",
                      cursor: dragLocked ? "pointer" : "grab"
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#78716C]">{formatNodeId(node.id)}</span>
                      {node.status === "critical" ? (
                        <motion.span
                          className="ml-auto h-2 w-2 rounded-full bg-[#9E3B2E]"
                          animate={{ scale: [1, 1.18, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <span className="ml-auto h-2 w-2 rounded-full" style={{ background: statusStyle.dot }} />
                      )}
                    </div>

                    <p className="mt-1.5 font-sans text-[15px] font-medium text-[#1A1612]">{node.label}</p>

                    <div className="mt-[10px] flex flex-wrap gap-1.5">
                      <span
                        className="rounded-md px-2 py-[3px] font-sans text-[10px] tracking-[0.12em]"
                        style={{ background: typeStyle.tagBg, color: typeStyle.tagText }}
                      >
                        {getTypeLabel(node.type)}
                      </span>
                      {node.status === "critical" || node.status === "unresolved" ? (
                        <span
                          className="rounded-md px-2 py-[3px] font-sans text-[10px] tracking-[0.12em]"
                          style={{
                            background: node.status === "critical" ? "rgba(224,85,85,0.12)" : "rgba(184,84,61,0.12)",
                            color: node.status === "critical" ? "#9E3B2E" : "#c4650a"
                          }}
                        >
                          {getStatusLabel(node.status)}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">
                      <GripHorizontalIcon className="h-3 w-3" />
                      DRAG NODE
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        <div
          className="absolute bottom-6 left-6 z-10 overflow-hidden rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {[
            { key: "zoom-in", icon: <ZoomInIcon className="h-[18px] w-[18px]" />, onClick: () => setZoom((current) => clamp(current + 0.2, 0.5, 2)) },
            { key: "zoom-out", icon: <ZoomOutIcon className="h-[18px] w-[18px]" />, onClick: () => setZoom((current) => clamp(current - 0.2, 0.5, 2)) },
            { key: "fit", icon: <MaximizeIcon className="h-[18px] w-[18px]" />, onClick: handleFitView },
            { key: "lock", icon: dragLocked ? <LockIcon className="h-[18px] w-[18px]" /> : <LockOpenIcon className="h-[18px] w-[18px]" />, onClick: () => setDragLocked((current) => !current) }
          ].map((control, index, array) => (
            <button
              key={control.key}
              type="button"
              onClick={control.onClick}
              className="flex h-10 w-10 items-center justify-center font-sans text-[18px] text-[#5A5450] transition-colors hover:bg-[#FAF8F5]"
              style={{ borderBottom: index === array.length - 1 ? "none" : "1px solid #FAF8F5" }}
            >
              {control.icon}
            </button>
          ))}
        </div>

        <div
          className="absolute bottom-6 z-10 overflow-hidden rounded-2xl border border-[rgba(26,22,18,0.08)] bg-[rgba(255,255,255,0.9)]"
          style={{ width: miniMapWidth, height: miniMapHeight, right: selectedNode ? 384 : 24 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="relative h-full w-full">
            {graph?.nodes.map((node) => {
              const position = nodePositions[node.id];
              if (!position) {
                return null;
              }

              return (
                <span
                  key={node.id}
                  className="absolute h-2 w-2 rounded-[2px]"
                  style={{
                    left: (position.x / worldWidth) * miniMapWidth,
                    top: (position.y / worldHeight) * miniMapHeight,
                    background: typeStyles[node.type].accent
                  }}
                />
              );
            })}

            <span
              className="absolute rounded-[6px] border border-[rgba(184,84,61,0.5)] bg-[rgba(184,84,61,0.08)]"
              style={{
                left: (visibleViewport.x / worldWidth) * miniMapWidth,
                top: (visibleViewport.y / worldHeight) * miniMapHeight,
                width: (visibleViewport.width / worldWidth) * miniMapWidth,
                height: (visibleViewport.height / worldHeight) * miniMapHeight
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {selectedNode ? (
            <motion.aside
              initial={{ x: detailPanelWidth, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: detailPanelWidth, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 right-0 top-0 z-20 flex w-[360px] flex-col overflow-y-auto border-l border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.97)]-[20px]"
              onMouseDown={(event) => event.stopPropagation()}
              onWheel={(event) => event.stopPropagation()}
            >
              <div className="px-6 pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: typeStyles[selectedNode.type].bg, color: typeStyles[selectedNode.type].accent }}
                  >
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <span className="font-mono text-[11px] text-[#78716C]">{formatNodeId(selectedNode.id)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5] text-[#78716C] transition-colors hover:bg-[rgba(26,22,18,0.08)]"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 font-sans text-[22px] tracking-[0.04em] text-[#1A1612]">{selectedNode.label}</p>

                <span
                  className="mt-2 inline-flex rounded-full px-3 py-1 font-sans text-[11px] tracking-[0.12em]"
                  style={{
                    background: statusStyles[selectedNode.status].pillBg,
                    color: statusStyles[selectedNode.status].pillText
                  }}
                >
                  {getStatusLabel(selectedNode.status)}
                </span>

                <div className="mb-5 mt-5 h-px bg-[#FAF8F5]" />
              </div>

              <div className="px-6">
                <p className="mb-2 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">OVERVIEW</p>
                <p className="font-sans text-[14px] leading-7 text-[#1A1612]">{selectedNode.description}</p>
              </div>

              <div className="mt-6 px-6">
                <p className="mb-3 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">SOURCE EVIDENCE</p>
                {selectedNode.docRefs.map((docRef) => (
                  <button
                    key={docRef}
                    type="button"
                    className="mb-2 flex items-center gap-2.5 text-left transition-colors hover:text-[#1A1612]"
                  >
                    <span className="text-[#B8543D]">
                      <FileTextIcon className="h-[14px] w-[14px]" />
                    </span>
                    <span className="font-sans text-[12px] text-[#5A5450]">{docRef}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 px-6">
                <p className="mb-3 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">CONNECTED TO</p>
                {connections.map(({ edge, node }) => (
                  <div key={edge.id} className="mb-2 flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: typeStyles[node.type].accent }} />
                    <span className="font-sans text-[12px] text-[#5A5450]">{node.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-[rgba(120,113,108,0.6)]">{edge.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto p-6">
                <button
                  type="button"
                  className="w-full rounded-xl border-[1.5px] border-dashed border-[rgba(26,22,18,0.20)] py-3 text-center font-sans text-[13px] text-[#78716C] transition-colors hover:border-[#B8543D] hover:bg-[rgba(184,84,61,0.04)] hover:text-[#B8543D]"
                >
                  ASK SOCRATES ABOUT THIS
                </button>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
