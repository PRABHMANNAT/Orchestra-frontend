import { useEffect, useMemo, useRef, useState } from "react";
import { INGESTION_FLOWS, SOURCES } from "../data/mockBrainData";
import { SourceLogo } from "./SourceLogos";

/**
 * Knowledge Ingestion — animated river of items flowing from connected
 * sources into the central brain. Click a source row to focus its flow,
 * click the brain to pause, hover the recent feed to inspect what landed.
 */

type SampleItem = { kind: string; title: string };

const SAMPLE_ITEMS: Record<string, SampleItem[]> = {
  github: [
    { kind: "PR", title: "fix(auth): rotate refresh token on /me" },
    { kind: "commit", title: "feat(billing): stripe webhook handler" },
    { kind: "issue", title: "Race in queue worker under load" },
    { kind: "PR", title: "chore: bump react-router to 7.14" }
  ],
  gdrive: [
    { kind: "doc", title: "Series-A board update — May 2026" },
    { kind: "sheet", title: "ARR forecast Q3" },
    { kind: "slides", title: "Customer Acme renewal deck" }
  ],
  slack: [
    { kind: "thread", title: "#eng-incidents — webhook latency spike" },
    { kind: "msg", title: "Sarah → JWT rotation decision" },
    { kind: "thread", title: "#design — onboarding empty state" }
  ],
  notion: [
    { kind: "page", title: "Hiring loop — Staff Backend" },
    { kind: "page", title: "Decision log: auth migration" }
  ],
  figma: [
    { kind: "frame", title: "Onboarding · welcome screen v4" },
    { kind: "file", title: "Design System / Tokens v2" }
  ],
  linear: [
    { kind: "issue", title: "NS-412 Billing webhook retry" },
    { kind: "issue", title: "NS-418 Mobile session refresh" }
  ],
  gmail: [
    { kind: "thread", title: "Acme — quarterly review notes" },
    { kind: "msg", title: "Legal → MSA redline v3" }
  ],
  fireflies: [
    { kind: "transcript", title: "Northstar weekly sync — May 23" },
    { kind: "transcript", title: "Acme customer call" }
  ]
};

type Arrival = {
  id: number;
  sourceId: string;
  kind: string;
  title: string;
  at: number;
};

export function IngestionRiver() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [brainPulse, setBrainPulse] = useState(0);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const seenPhaseRef = useRef<Record<string, number>>({});
  const arrivalIdRef = useRef(0);

  // Track container size
  useEffect(() => {
    if (!wrapRef.current) return;
    const update = () => {
      const r = wrapRef.current!.getBoundingClientRect();
      setBox({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Initialize per-source running totals from mock data
  useEffect(() => {
    const init: Record<string, number> = {};
    INGESTION_FLOWS.forEach((f) => {
      const meta = SOURCES.find((s) => s.id === f.sourceId);
      init[f.sourceId] = meta?.itemsIndexed ?? 0;
    });
    setCounters(init);
  }, []);

  // Animation timer
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || paused) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = t - last;
      last = t;
      setTick((v) => (v + dt / 6200) % 1); // ~6.2s per full traversal
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // Decay the brain pulse intensity
  useEffect(() => {
    if (brainPulse === 0) return;
    const id = setInterval(() => {
      setBrainPulse((p) => Math.max(0, p - 0.04));
    }, 60);
    return () => clearInterval(id);
  }, [brainPulse]);

  const flows = useMemo(
    () =>
      INGESTION_FLOWS.map((f, i) => {
        const meta = SOURCES.find((s) => s.id === f.sourceId);
        return {
          ...f,
          name: meta?.name ?? f.sourceId,
          items: meta?.itemsIndexed ?? 0,
          status: meta?.status,
          index: i
        };
      }),
    []
  );

  const activeFlows = useMemo(() => flows.filter((f) => f.active), [flows]);

  // Detect "arrival" events — when a flow's traversal crosses ~0.96
  useEffect(() => {
    activeFlows.forEach((flow, i) => {
      const phase = (tick + i * 0.17) % 1;
      const prev = seenPhaseRef.current[flow.sourceId] ?? phase;
      // Crossing the arrival threshold (handles wrap)
      const crossed =
        (prev < 0.96 && phase >= 0.96) || (prev > 0.96 && phase < 0.05);
      if (crossed) {
        const samples = SAMPLE_ITEMS[flow.sourceId] ?? [
          { kind: "item", title: "New content ingested" }
        ];
        const pick = samples[Math.floor(Math.random() * samples.length)];
        setArrivals((arr) => {
          const next: Arrival = {
            id: ++arrivalIdRef.current,
            sourceId: flow.sourceId,
            kind: pick.kind,
            title: pick.title,
            at: Date.now()
          };
          return [next, ...arr].slice(0, 6);
        });
        setCounters((c) => ({
          ...c,
          [flow.sourceId]: (c[flow.sourceId] ?? 0) + 1
        }));
        setBrainPulse((p) => Math.min(1, p + 0.55));
      }
      seenPhaseRef.current[flow.sourceId] = phase;
    });
  }, [tick, activeFlows]);

  // Layout — split the canvas: left rail for source rows, big brain in centre,
  // right rail for the live feed. Pad generously to fix prior cramping.
  const LEFT_RAIL = 220;
  const RIGHT_RAIL = 260;
  const TOP_PAD = 30;
  const BOTTOM_PAD = 30;
  const brainX = LEFT_RAIL + Math.max(120, (box.w - LEFT_RAIL - RIGHT_RAIL) / 2);
  const brainY = TOP_PAD + (box.h - TOP_PAD - BOTTOM_PAD) / 2;
  const usableH = box.h - TOP_PAD - BOTTOM_PAD;
  const rowH =
    activeFlows.length > 0 ? usableH / activeFlows.length : usableH;

  function bezierPoint(
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    t: number
  ) {
    const cx1 = (sx + ex) / 2;
    const cy1 = sy;
    const cx2 = (sx + ex) / 2;
    const cy2 = ey;
    const x =
      (1 - t) ** 3 * sx +
      3 * (1 - t) ** 2 * t * cx1 +
      3 * (1 - t) * t ** 2 * cx2 +
      t ** 3 * ex;
    const y =
      (1 - t) ** 3 * sy +
      3 * (1 - t) ** 2 * t * cy1 +
      3 * (1 - t) * t ** 2 * cy2 +
      t ** 3 * ey;
    return { x, y };
  }

  function bezierPath(sx: number, sy: number, ex: number, ey: number) {
    const cx1 = (sx + ex) / 2;
    const cy1 = sy;
    const cx2 = (sx + ex) / 2;
    const cy2 = ey;
    return `M ${sx} ${sy} C ${cx1} ${cy1} ${cx2} ${cy2} ${ex} ${ey}`;
  }

  const totalIngested = Object.values(counters).reduce((a, b) => a + b, 0);
  const activeCount = activeFlows.length;
  // Items per minute = arrivals in last 60s
  const rate = arrivals.filter((a) => Date.now() - a.at < 60000).length;

  return (
    <section className="py-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
            Knowledge Ingestion
          </div>
          <h2 className="mt-1 font-serif text-[22px] leading-[1.15] tracking-[-0.01em] text-[#1A1612]">
            What's flowing into the brain
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">
              Indexed total
            </div>
            <div className="font-mono text-[16px] text-[#1A1612] tabular-nums">
              {totalIngested.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-px bg-[rgba(26,22,18,0.1)]" />
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">
              Active / Rate
            </div>
            <div className="font-mono text-[16px] text-[#1A1612] tabular-nums">
              {activeCount} <span className="text-[#A89C8A]">·</span> {rate}/min
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5A5450] hover:bg-[#FAF8F5]"
          >
            {paused ? "▶ Resume" : "❚❚ Pause"}
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative h-[420px] overflow-hidden rounded-[6px] border border-[rgba(26,22,18,0.08)] bg-gradient-to-br from-[#FAF8F5] to-[#F5F1EB]"
      >
        {box.w > 0 && (
          <svg
            width={box.w}
            height={box.h}
            viewBox={`0 0 ${box.w} ${box.h}`}
            className="absolute inset-0"
          >
            <defs>
              <radialGradient id="ir-brain-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(184,84,61,0.35)" />
                <stop offset="60%" stopColor="rgba(184,84,61,0.10)" />
                <stop offset="100%" stopColor="rgba(184,84,61,0)" />
              </radialGradient>
              <linearGradient id="ir-flow" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(184,84,61,0)" />
                <stop offset="50%" stopColor="rgba(184,84,61,0.55)" />
                <stop offset="100%" stopColor="rgba(184,84,61,0)" />
              </linearGradient>
            </defs>

            {/* Brain glow halo */}
            <circle
              cx={brainX}
              cy={brainY}
              r={70 + brainPulse * 24}
              fill="url(#ir-brain-glow)"
              opacity={0.6 + brainPulse * 0.4}
              style={{ transition: "r 0.18s ease-out" }}
            />

            {/* Flow lines */}
            {activeFlows.map((flow, i) => {
              const sy = TOP_PAD + rowH * (i + 0.5);
              const sx = LEFT_RAIL;
              const ex = brainX - 40;
              const ey = brainY;
              const focused = focusId === flow.sourceId;
              const dimmed = focusId && !focused;
              return (
                <g key={`line-${flow.sourceId}`}>
                  {/* Base line */}
                  <path
                    d={bezierPath(sx, sy, ex, ey)}
                    stroke={focused ? "rgba(184,84,61,0.55)" : "rgba(184,84,61,0.22)"}
                    strokeWidth={focused ? 1.6 : 1}
                    fill="none"
                    strokeLinecap="round"
                    opacity={dimmed ? 0.18 : 1}
                  />
                  {/* Animated dash overlay */}
                  <path
                    d={bezierPath(sx, sy, ex, ey)}
                    stroke="rgba(184,84,61,0.45)"
                    strokeWidth={focused ? 1.6 : 1}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="3 12"
                    strokeDashoffset={-tick * 60 - i * 8}
                    opacity={dimmed ? 0.1 : 0.7}
                  />
                </g>
              );
            })}

            {/* Pulse rings expanding from the brain on arrival */}
            {brainPulse > 0.05 && (
              <>
                <circle
                  cx={brainX}
                  cy={brainY}
                  r={48 + (1 - brainPulse) * 60}
                  fill="none"
                  stroke="rgba(184,84,61,0.5)"
                  strokeWidth={1.5}
                  opacity={brainPulse * 0.8}
                />
                <circle
                  cx={brainX}
                  cy={brainY}
                  r={48 + (1 - brainPulse) * 90}
                  fill="none"
                  stroke="rgba(184,84,61,0.3)"
                  strokeWidth={1}
                  opacity={brainPulse * 0.5}
                />
              </>
            )}

            {/* Brain target */}
            <g
              onClick={() => setPaused((p) => !p)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={brainX}
                cy={brainY}
                r={46}
                fill="#FFFFFF"
                stroke="rgba(184,84,61,0.45)"
                strokeWidth={1.5}
              />
              <circle
                cx={brainX}
                cy={brainY}
                r={36 + brainPulse * 3}
                fill="rgba(184,84,61,0.10)"
                stroke="rgba(184,84,61,0.28)"
                style={{ transition: "r 0.18s ease-out" }}
              />
              <text
                x={brainX}
                y={brainY + 6}
                textAnchor="middle"
                fontFamily="Fraunces, ui-serif, Georgia, serif"
                fontSize="22"
                fontWeight="500"
                fill="#1A1612"
              >
                Σ
              </text>
              <text
                x={brainX}
                y={brainY + 68}
                textAnchor="middle"
                fontFamily="Geist Mono, monospace"
                fontSize="9"
                letterSpacing="0.18em"
                fill="#8A7E6F"
              >
                BRAIN · {paused ? "PAUSED" : "LIVE"}
              </text>
            </g>

            {/* Sparkle particles on arrival */}
            {brainPulse > 0.2 &&
              Array.from({ length: 6 }).map((_, k) => {
                const angle = (k / 6) * Math.PI * 2;
                const dist = 36 + (1 - brainPulse) * 30;
                return (
                  <circle
                    key={`spark-${k}`}
                    cx={brainX + Math.cos(angle) * dist}
                    cy={brainY + Math.sin(angle) * dist}
                    r={1.6}
                    fill="rgba(184,84,61,0.85)"
                    opacity={brainPulse}
                  />
                );
              })}
          </svg>
        )}

        {/* Left rail — source rows */}
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: LEFT_RAIL, paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
        >
          {box.h > 0 &&
            activeFlows.map((flow, i) => {
              const sy = TOP_PAD + rowH * (i + 0.5);
              const focused = focusId === flow.sourceId;
              const dimmed = focusId && !focused;
              const items = counters[flow.sourceId] ?? flow.items;
              return (
                <button
                  type="button"
                  key={flow.sourceId}
                  onClick={() =>
                    setFocusId((cur) => (cur === flow.sourceId ? null : flow.sourceId))
                  }
                  onMouseEnter={() => setFocusId(flow.sourceId)}
                  onMouseLeave={() => setFocusId(null)}
                  className="absolute left-3 flex items-center gap-2.5 rounded-[4px] border bg-white/70 px-2 py-1.5 text-left backdrop-blur-sm transition-all hover:bg-white"
                  style={{
                    top: sy - 18,
                    width: LEFT_RAIL - 24,
                    borderColor: focused
                      ? "rgba(184,84,61,0.4)"
                      : "rgba(26,22,18,0.08)",
                    opacity: dimmed ? 0.4 : 1,
                    boxShadow: focused ? "0 0 0 2px rgba(184,84,61,0.12)" : "none"
                  }}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-white"
                    style={{
                      boxShadow: "0 1px 2px rgba(26,22,18,0.06)"
                    }}
                  >
                    <SourceLogo id={flow.sourceId} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-[#1A1612]">
                      {flow.name}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8A7E6F]">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            flow.status === "syncing" ? "#C28840" : "#7A8C5F"
                        }}
                      />
                      <span className="tabular-nums">
                        {items.toLocaleString()}
                      </span>
                      <span className="text-[#A89C8A]">items</span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Animated travelling chips */}
        {box.w > 0 &&
          activeFlows.map((flow, i) => {
            const sy = TOP_PAD + rowH * (i + 0.5);
            const t = (tick + i * 0.17) % 1;
            const point = bezierPoint(LEFT_RAIL, sy, brainX - 40, brainY, t);
            const fade =
              t < 0.07 ? t / 0.07 : t > 0.94 ? Math.max(0, (1 - t) / 0.06) : 1;
            const focused = focusId === flow.sourceId;
            const dimmed = focusId && !focused;
            const scale = t > 0.9 ? 1 - (t - 0.9) * 4 : 1; // shrink as it lands
            return (
              <div
                key={`travel-${flow.sourceId}`}
                className="pointer-events-none absolute"
                style={{
                  left: point.x - 13,
                  top: point.y - 13,
                  opacity: dimmed ? 0.2 : fade,
                  transform: `scale(${Math.max(0.3, scale)})`,
                  transition: "opacity 0.2s ease"
                }}
              >
                <div
                  className="rounded-[4px] bg-white p-0.5"
                  style={{
                    boxShadow: focused
                      ? "0 2px 12px rgba(184,84,61,0.35)"
                      : "0 2px 8px rgba(26,22,18,0.14)"
                  }}
                >
                  <SourceLogo id={flow.sourceId} size={20} />
                </div>
              </div>
            );
          })}

        {/* Right rail — live feed */}
        <div
          className="absolute inset-y-0 right-0 flex flex-col gap-1.5 border-l border-[rgba(26,22,18,0.06)] bg-white/40 px-3 backdrop-blur-sm"
          style={{ width: RIGHT_RAIL, paddingTop: TOP_PAD - 6, paddingBottom: BOTTOM_PAD }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A7E6F]">
              Just landed
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#A89C8A]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[#7A8C5F]"
                style={{
                  animation: paused ? "none" : "ir-feed-blink 1.6s ease-in-out infinite"
                }}
              />
              {paused ? "paused" : "live"}
            </span>
          </div>
          {arrivals.length === 0 ? (
            <div className="font-mono text-[10px] text-[#A89C8A]">
              waiting for the first item…
            </div>
          ) : (
            arrivals.map((a, k) => {
              const meta = SOURCES.find((s) => s.id === a.sourceId);
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-2 rounded-[3px] border border-[rgba(26,22,18,0.06)] bg-white px-2 py-1.5"
                  style={{
                    animation:
                      k === 0 ? "ir-feed-in 0.35s ease-out" : "none",
                    opacity: 1 - k * 0.12
                  }}
                >
                  <SourceLogo id={a.sourceId} size={16} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8A7E6F]">
                      <span>{meta?.name ?? a.sourceId}</span>
                      <span className="text-[#A89C8A]">·</span>
                      <span className="text-[#B8543D]">{a.kind}</span>
                    </div>
                    <div className="truncate text-[11px] leading-tight text-[#1A1612]">
                      {a.title}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes ir-feed-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ir-feed-blink {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
