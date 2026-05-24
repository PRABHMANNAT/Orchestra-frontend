import { useEffect, useRef, useState } from "react";
import { INGESTION_FLOWS, SOURCES } from "../data/mockBrainData";
import { SourceLogo } from "./SourceLogos";

/**
 * Knowledge ingestion — connector logos flow into the central brain along
 * curved lines. Foreign-Object SVG carries the real logo chips so they
 * animate along precise bezier paths. Calm pace, no frenzy.
 */
export function IngestionRiver() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 240 });
  const [tick, setTick] = useState(0);

  // Track size
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Drive the animation timer
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      setTick((v) => (v + dt / 5800) % 1); // ~5.8s per full traversal
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const flows = INGESTION_FLOWS.map((f, i) => {
    const meta = SOURCES.find((s) => s.id === f.sourceId);
    return { ...f, name: meta?.name ?? f.sourceId, items: meta?.itemsIndexed ?? 0, index: i };
  });

  const brainX = box.w - 100;
  const brainY = box.h / 2;
  const leftPad = 70;
  const rowH = (box.h - 40) / Math.max(1, flows.length);

  function bezierPoint(sx: number, sy: number, ex: number, ey: number, t: number) {
    const cx1 = (sx + ex) / 2;
    const cy1 = sy;
    const cx2 = (sx + ex) / 2;
    const cy2 = ey;
    const x =
      (1 - t) ** 3 * sx + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * ex;
    const y =
      (1 - t) ** 3 * sy + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * ey;
    return { x, y };
  }

  function bezierPath(sx: number, sy: number, ex: number, ey: number) {
    const cx1 = (sx + ex) / 2;
    const cy1 = sy;
    const cx2 = (sx + ex) / 2;
    const cy2 = ey;
    return `M ${sx} ${sy} C ${cx1} ${cy1} ${cx2} ${cy2} ${ex} ${ey}`;
  }

  return (
    <section className="py-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
          Knowledge Ingestion
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">
          5 active flows · last 24h
        </span>
      </div>
      <div
        ref={wrapRef}
        className="relative h-[280px] overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]"
      >
        <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} className="absolute inset-0">
          {/* Flow lines (static) */}
          {flows.map((flow, i) => {
            const sy = 20 + rowH * (i + 0.5);
            return (
              <path
                key={`line-${flow.sourceId}`}
                d={bezierPath(leftPad + 24, sy, brainX - 36, brainY)}
                stroke={flow.active ? "rgba(184,84,61,0.36)" : "rgba(26,22,18,0.08)"}
                strokeWidth={flow.active ? 1.2 : 0.8}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Brain target */}
          <g>
            <circle
              cx={brainX}
              cy={brainY}
              r={36}
              fill="#F5F1EB"
              stroke="rgba(184,84,61,0.4)"
              strokeWidth={1.5}
            />
            <circle
              cx={brainX}
              cy={brainY}
              r={28}
              fill="rgba(184,84,61,0.08)"
              stroke="rgba(184,84,61,0.2)"
            />
            <text
              x={brainX}
              y={brainY + 4}
              textAnchor="middle"
              fontFamily="Fraunces, ui-serif, Georgia, serif"
              fontSize="14"
              fontWeight="500"
              fill="#1A1612"
            >
              Σ
            </text>
            <text
              x={brainX}
              y={brainY + 56}
              textAnchor="middle"
              fontFamily="Geist Mono, monospace"
              fontSize="9"
              letterSpacing="0.16em"
              fill="#8A7E6F"
            >
              BRAIN
            </text>
          </g>
        </svg>

        {/* Static source markers (left side) */}
        <div className="absolute inset-y-0 left-0" style={{ width: leftPad + 56 }}>
          {flows.map((flow, i) => {
            const sy = 20 + rowH * (i + 0.5);
            return (
              <div
                key={flow.sourceId}
                className="absolute flex items-center gap-2"
                style={{ left: 12, top: sy - 14, height: 28 }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-[4px]"
                  style={{
                    boxShadow: flow.active ? "0 0 0 2px rgba(184,84,61,0.16)" : undefined,
                    opacity: flow.active ? 1 : 0.55
                  }}
                >
                  <SourceLogo id={flow.sourceId} size={22} />
                </div>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: flow.active ? "#1A1612" : "#A89C8A" }}
                >
                  {flow.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated logo chips travelling along the lines */}
        {flows
          .filter((f) => f.active)
          .map((flow, i) => {
            const sy = 20 + rowH * (flow.index + 0.5);
            // staggered phase per flow
            const t = (tick + i * 0.16) % 1;
            const point = bezierPoint(leftPad + 24, sy, brainX - 36, brainY, t);
            const fade = t < 0.07 ? t / 0.07 : t > 0.94 ? (1 - t) / 0.06 : 1;
            return (
              <div
                key={`travel-${flow.sourceId}`}
                className="pointer-events-none absolute"
                style={{
                  left: point.x - 11,
                  top: point.y - 11,
                  opacity: fade
                }}
              >
                <div className="rounded-[4px] bg-white p-0.5 shadow-[0_2px_8px_rgba(26,22,18,0.12)]">
                  <SourceLogo id={flow.sourceId} size={18} />
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
