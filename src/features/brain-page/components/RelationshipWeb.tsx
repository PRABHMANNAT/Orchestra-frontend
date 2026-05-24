import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum
} from "d3-force";
import { WEB_LINKS, WEB_NODES, type WebNode, type WebNodeType } from "../data/mockBrainData";

const COLORS: Record<WebNodeType, string> = {
  project: "#B8543D",
  doc: "#3B82C4",
  decision: "#7A8C5F",
  person: "#C28840",
  customer: "#8B7FD4"
};

const LABELS: Record<WebNodeType, string> = {
  project: "Project",
  doc: "Document",
  decision: "Decision",
  person: "Person",
  customer: "Customer"
};

type SimNode = WebNode &
  SimulationNodeDatum & {
    x: number;
    y: number;
    radius: number;
  };

type RawSimLink = SimulationLinkDatum<SimNode> & {
  weight: number;
};

type SimLink = RawSimLink & {
  source: SimNode;
  target: SimNode;
};

type PointerWorld = {
  screenX: number;
  screenY: number;
  x: number;
  y: number;
};

function hashString(value: string) {
  let h = 0;
  for (let index = 0; index < value.length; index++) {
    h = (h << 5) - h + value.charCodeAt(index);
    h |= 0;
  }
  return Math.abs(h);
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function createNodes(): SimNode[] {
  const projectIds = WEB_NODES.filter((node) => node.type === "project").map((node) => node.id);

  return WEB_NODES.map((node, index) => {
    const seed = hashString(node.id);
    const projectIndex = projectIds.indexOf(node.id);
    const isProject = projectIndex >= 0;
    const angle = isProject ? (projectIndex / projectIds.length) * Math.PI * 2 : (index / WEB_NODES.length) * Math.PI * 2;
    const radius = isProject ? 68 : 185 + seededUnit(seed + 3) * 78;

    return {
      ...node,
      radius: node.size,
      x: Math.cos(angle) * radius + (seededUnit(seed + 11) - 0.5) * 28,
      y: Math.sin(angle) * radius + (seededUnit(seed + 19) - 0.5) * 28,
      vx: 0,
      vy: 0
    };
  });
}

export function RelationshipWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stateRef = useRef<{
    nodes: SimNode[];
    links: SimLink[];
    simulation: Simulation<SimNode, undefined> | null;
    scale: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    dragNode: SimNode | null;
    dragOffsetX: number;
    dragOffsetY: number;
    dragMoved: boolean;
    pointerStart: { x: number; y: number } | null;
    panFrom: { x: number; y: number } | null;
    reducedMotion: boolean;
    hoverId: string | null;
    selectedId: string | null;
    animationId: number;
    inView: boolean;
  }>({
    nodes: [],
    links: [],
    simulation: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
    dragNode: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragMoved: false,
    pointerStart: null,
    panFrom: null,
    reducedMotion: false,
    hoverId: null,
    selectedId: null,
    animationId: 0,
    inView: true
  });

  useEffect(() => {
    stateRef.current.hoverId = hoverId;
  }, [hoverId]);

  useEffect(() => {
    stateRef.current.selectedId = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const wrapElement = wrapRef.current;
    if (!canvasElement || !wrapElement) return;

    const context = canvasElement.getContext("2d");
    if (!context) return;

    const canvas = canvasElement;
    const wrap = wrapElement;
    const ctx = context;

    const state = stateRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    state.reducedMotion = media.matches;

    const nodes = createNodes();
    const links: RawSimLink[] = WEB_LINKS.map((link) => ({
      source: link.source,
      target: link.target,
      weight: link.weight
    }));

    const simulation = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, RawSimLink>(links)
          .id((node) => node.id)
          .distance((link) => 116 - link.weight * 13)
          .strength((link) => 0.035 + link.weight * 0.025)
      )
      .force("charge", forceManyBody<SimNode>().strength((node) => (node.type === "project" ? -520 : -270)))
      .force("collide", forceCollide<SimNode>().radius((node) => node.radius + 18).iterations(2))
      .force("center", forceCenter<SimNode>(0, 0))
      .force("x", forceX<SimNode>(0).strength((node) => (node.type === "project" ? 0.065 : 0.018)))
      .force("y", forceY<SimNode>(0).strength((node) => (node.type === "project" ? 0.065 : 0.018)))
      .stop();

    state.nodes = nodes;
    state.links = links.filter((link): link is SimLink => typeof link.source !== "string" && typeof link.target !== "string");
    state.simulation = simulation;

    for (let tick = 0; tick < (state.reducedMotion ? 220 : 44); tick++) {
      simulation.tick();
    }
    if (state.reducedMotion) {
      simulation.alpha(0);
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.width = rect.width;
      state.height = rect.height;
      if (!state.panFrom && !state.dragNode) {
        state.offsetX = rect.width / 2;
        state.offsetY = rect.height / 2;
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        state.inView = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(wrap);

    function eventToWorld(event: PointerEvent | WheelEvent): PointerWorld {
      const rect = canvas.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      return {
        screenX,
        screenY,
        x: (screenX - state.offsetX) / state.scale,
        y: (screenY - state.offsetY) / state.scale
      };
    }

    function pickNode(x: number, y: number) {
      for (let index = state.nodes.length - 1; index >= 0; index--) {
        const node = state.nodes[index];
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= (node.radius + 4) * (node.radius + 4)) return node;
      }
      return null;
    }

    const entranceStart = performance.now();

    function draw() {
      const { width, height } = state;
      const now = performance.now();
      const time = now / 1000;
      const entranceT = Math.min(1, (now - entranceStart) / 900);
      const easedEntrance = 1 - Math.pow(1 - entranceT, 3);

      ctx.clearRect(0, 0, width, height);

      // Background dot grid — extremely faint, gives the canvas depth
      ctx.save();
      ctx.translate(state.offsetX, state.offsetY);
      ctx.scale(state.scale, state.scale);

      const focusId = state.hoverId ?? state.selectedId;
      const connected = new Set<string>();
      if (focusId) {
        connected.add(focusId);
        for (const link of state.links) {
          if (link.source.id === focusId) connected.add(link.target.id);
          if (link.target.id === focusId) connected.add(link.source.id);
        }
      }

      // Faint sparse background dots in world space (gives a sense of "field")
      const gridSize = 36;
      const gridRange = 500;
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#1A1612";
      for (let gx = -gridRange; gx <= gridRange; gx += gridSize) {
        for (let gy = -gridRange; gy <= gridRange; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // ───── EDGES with traveling pulse comets ─────
      for (const link of state.links) {
        const isFocused = !focusId || link.source.id === focusId || link.target.id === focusId;
        const isHubLink = link.source.type === "project" || link.target.type === "project";

        // Curve geometry
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.hypot(dx, dy) || 1;
        const bow = Math.min(34, dist * 0.09);
        const mx = (link.source.x + link.target.x) / 2;
        const my = (link.source.y + link.target.y) / 2;
        const nx = (-dy / dist) * bow;
        const ny = (dx / dist) * bow;
        const ctlX = mx + nx;
        const ctlY = my + ny;

        // Base curve — brighter when focused
        const widthByWeight = Math.max(0.6, link.weight * 0.55);
        ctx.globalAlpha = isFocused ? (focusId ? 0.42 : 0.24) : 0.06;
        ctx.strokeStyle = isFocused
          ? `rgba(26,22,18,${0.55})`
          : "rgba(26,22,18,0.3)";
        ctx.lineWidth = widthByWeight;
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.quadraticCurveTo(ctlX, ctlY, link.target.x, link.target.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Traveling comets — speed up on focused/hub links
        const drawPulses = !state.reducedMotion && isFocused;
        if (drawPulses) {
          const isFocusEdge = focusId && (link.source.id === focusId || link.target.id === focusId);
          const speed = isFocusEdge ? 0.9 : isHubLink ? 0.42 : 0.28;
          const pulseCount = isFocusEdge ? 3 : isHubLink ? 2 : 1;
          // Direction: pulses flow OUT from project hubs (or out of focused node)
          let outwardFromSource = link.source.type === "project";
          if (focusId) outwardFromSource = link.source.id === focusId;

          const sourceColor = COLORS[(outwardFromSource ? link.source.type : link.target.type)];

          for (let p = 0; p < pulseCount; p++) {
            const offset = p / pulseCount;
            // Deterministic phase based on edge geometry so they don't all sync
            const phaseSeed = (link.source.x + link.target.y) * 0.0017;
            const tRaw = ((time * speed) + offset + phaseSeed) % 1;
            const tt = outwardFromSource ? tRaw : 1 - tRaw;
            // 4-step comet trail
            const TRAIL = 5;
            for (let trail = 0; trail < TRAIL; trail++) {
              const tt2 = tt - trail * 0.022 * (outwardFromSource ? 1 : -1);
              if (tt2 < 0 || tt2 > 1) continue;
              const u = 1 - tt2;
              const px = u * u * link.source.x + 2 * u * tt2 * ctlX + tt2 * tt2 * link.target.x;
              const py = u * u * link.source.y + 2 * u * tt2 * ctlY + tt2 * tt2 * link.target.y;
              const trailAlpha = (1 - trail / TRAIL) * (isFocusEdge ? 1 : 0.7);
              const radius = (2.4 - trail * 0.35) * (isFocusEdge ? 1.2 : 1);
              ctx.globalAlpha = trailAlpha;
              ctx.fillStyle = sourceColor;
              ctx.beginPath();
              ctx.arc(px, py, Math.max(0.4, radius), 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      // ───── BREATHING RINGS on project hubs ─────
      if (!state.reducedMotion) {
        for (const node of state.nodes) {
          if (node.type !== "project") continue;
          const dim = focusId && !connected.has(node.id);
          if (dim) continue;
          const baseR = node.radius * easedEntrance;
          // 2 expanding rings with offset phases
          for (let ring = 0; ring < 2; ring++) {
            const ringPhase = ((time / 3.6) + ring * 0.5 + node.x * 0.0009) % 1;
            const ringR = baseR + ringPhase * 40;
            const ringAlpha = (1 - ringPhase) * 0.22;
            ctx.globalAlpha = ringAlpha;
            ctx.strokeStyle = COLORS[node.type];
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

      // ───── NODES ─────
      for (const node of state.nodes) {
        const dim = focusId && !connected.has(node.id);
        const isFocus = focusId === node.id;
        const nodeAlpha = dim ? 0.18 : 1;
        const r = node.radius * easedEntrance;

        // Focal pulse ring on hover/selected node
        if (isFocus && !state.reducedMotion) {
          const pulse = 0.5 + 0.5 * Math.sin(time * 4);
          ctx.globalAlpha = 0.25 + pulse * 0.4;
          ctx.strokeStyle = COLORS[node.type];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 8 + pulse * 4, 0, Math.PI * 2);
          ctx.stroke();
          // outer dotted ring
          ctx.globalAlpha = 0.18;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 16 + pulse * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }

        // Soft glow halo (no neon, just subtle warm bleed)
        ctx.globalAlpha = nodeAlpha * 0.16;
        ctx.fillStyle = COLORS[node.type];
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.fill();

        // Node body
        ctx.globalAlpha = nodeAlpha;
        ctx.fillStyle = COLORS[node.type];
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight (top-left soft white) — gives a 3D feel
        ctx.globalAlpha = nodeAlpha * 0.4;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.beginPath();
        ctx.arc(node.x - r * 0.32, node.y - r * 0.32, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Outer outline ring
        ctx.globalAlpha = nodeAlpha * 0.7;
        ctx.strokeStyle = "rgba(26,22,18,0.32)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Label with subtle paint-order outline so it reads over any background
        ctx.globalAlpha = dim ? 0.34 : 1;
        ctx.font =
          node.type === "project"
            ? "600 13px Georgia, ui-serif, serif"
            : "500 10.5px Geist, -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        // halo
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(240,233,223,0.85)";
        ctx.strokeText(node.label, node.x, node.y + r + 6, node.type === "project" ? 132 : 108);
        ctx.fillStyle = dim ? "rgba(26,22,18,0.34)" : "#1A1612";
        ctx.fillText(node.label, node.x, node.y + r + 6, node.type === "project" ? 132 : 108);

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function loop() {
      if (state.inView && !state.reducedMotion && state.simulation && state.simulation.alpha() > 0.002) {
        state.simulation.tick();
      }
      // Always redraw — even when physics has settled, the comet pulses and
      // breathing rings need a fresh frame.
      if (state.inView) {
        draw();
      }
      state.animationId = requestAnimationFrame(loop);
    }

    function onPointerMove(event: PointerEvent) {
      const pointer = eventToWorld(event);
      if (state.dragNode) {
        state.dragNode.fx = pointer.x - state.dragOffsetX;
        state.dragNode.fy = pointer.y - state.dragOffsetY;
        if (state.pointerStart && Math.hypot(event.clientX - state.pointerStart.x, event.clientY - state.pointerStart.y) > 4) {
          state.dragMoved = true;
        }
        state.simulation?.alpha(0.22);
        canvas.style.cursor = "grabbing";
        return;
      }

      if (state.panFrom) {
        state.offsetX += event.clientX - state.panFrom.x;
        state.offsetY += event.clientY - state.panFrom.y;
        state.panFrom = { x: event.clientX, y: event.clientY };
        canvas.style.cursor = "grabbing";
        return;
      }

      const hit = pickNode(pointer.x, pointer.y);
      const nextHoverId = hit?.id ?? null;
      if (nextHoverId !== state.hoverId) {
        setHoverId(nextHoverId);
      }
      canvas.style.cursor = hit ? "pointer" : "grab";
    }

    function onPointerDown(event: PointerEvent) {
      const pointer = eventToWorld(event);
      const hit = pickNode(pointer.x, pointer.y);
      canvas.setPointerCapture(event.pointerId);
      if (hit) {
        state.dragNode = hit;
        state.dragOffsetX = pointer.x - hit.x;
        state.dragOffsetY = pointer.y - hit.y;
        state.dragMoved = false;
        state.pointerStart = { x: event.clientX, y: event.clientY };
        hit.fx = hit.x;
        hit.fy = hit.y;
        state.simulation?.alpha(0.24);
      } else {
        state.panFrom = { x: event.clientX, y: event.clientY };
      }
    }

    function onPointerUp(event: PointerEvent) {
      if (state.dragNode) {
        if (!state.dragMoved) {
          setSelectedId((current) => (current === state.dragNode?.id ? null : state.dragNode?.id ?? null));
        }
        state.dragNode.fx = null;
        state.dragNode.fy = null;
        state.dragNode = null;
        state.pointerStart = null;
        state.simulation?.alpha(0.16);
      }
      state.panFrom = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.style.cursor = "grab";
    }

    function onPointerLeave() {
      if (!state.dragNode && !state.panFrom) {
        setHoverId(null);
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const pointer = eventToWorld(event);
      const zoom = 1 - event.deltaY * 0.0012;
      const nextScale = Math.max(0.5, Math.min(2.35, state.scale * zoom));
      state.offsetX = pointer.screenX - pointer.x * nextScale;
      state.offsetY = pointer.screenY - pointer.y * nextScale;
      state.scale = nextScale;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    loop();

    return () => {
      cancelAnimationFrame(state.animationId);
      simulation.stop();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  const hoveredNode = useMemo(() => WEB_NODES.find((node) => node.id === hoverId) ?? null, [hoverId]);
  const selectedNode = useMemo(() => WEB_NODES.find((node) => node.id === selectedId) ?? null, [selectedId]);
  const selectedLinks = useMemo(() => {
    if (!selectedId) return [];
    return WEB_LINKS.filter((link) => link.source === selectedId || link.target === selectedId)
      .map((link) => {
        const otherId = link.source === selectedId ? link.target : link.source;
        const node = WEB_NODES.find((item) => item.id === otherId);
        return node ? { node, weight: link.weight } : null;
      })
      .filter(Boolean) as { node: WebNode; weight: number }[];
  }, [selectedId]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Context Web</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">pan / zoom / hover / click</span>
      </div>

      <div
        ref={wrapRef}
        className="relative flex-1 overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#F0E9DF]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 cursor-grab" />

        {selectedNode ? (
          <div className="absolute right-3 top-3 w-[280px] rounded-[4px] border border-[rgba(26,22,18,0.1)] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-[15px] leading-tight text-[#1A1612]">{selectedNode.label}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">
                  {LABELS[selectedNode.type]} node
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-[3px] border border-[rgba(26,22,18,0.1)] px-1.5 py-0.5 font-mono text-[10px] text-[#8A7E6F] hover:bg-[#FAF8F5]"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-1.5">
              {selectedLinks.slice(0, 5).map(({ node, weight }) => (
                <div key={node.id} className="flex items-center justify-between gap-3 font-mono text-[10px] text-[#5A5450]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLORS[node.type] }} />
                    <span className="truncate">{node.label}</span>
                  </span>
                  <span className="text-[#A89C8A]">x{weight}</span>
                </div>
              ))}
            </div>
          </div>
        ) : hoveredNode ? (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[240px] rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-2 shadow-sm">
            <div className="font-serif text-[13px] text-[#1A1612]">{hoveredNode.label}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">{LABELS[hoveredNode.type]}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {(Object.keys(COLORS) as WebNodeType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#5A5450]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[type] }} />
            {LABELS[type]}
          </div>
        ))}
      </div>
    </div>
  );
}
