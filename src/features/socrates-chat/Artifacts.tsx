import { useState } from "react";
import {
  ARCH_EDGES,
  ARCH_NODES,
  CALENDAR_EVENTS,
  CODE_SAMPLE,
  COMPARE_DATA,
  DECISIONS,
  GRAPH_DATA,
  METRICS_DATA,
  ORG_NODES,
  RFC_DOC,
  type ArtifactKind
} from "./data";

export function Artifact({ kind }: { kind: ArtifactKind }) {
  switch (kind) {
    case "calendar": return <CalendarArtifact />;
    case "arch": return <ArchArtifact />;
    case "compare": return <CompareArtifact />;
    case "metrics": return <MetricsArtifact />;
    case "org": return <OrgArtifact />;
    case "decisions": return <DecisionsArtifact />;
    case "doc": return <DocArtifact />;
    case "code": return <CodeArtifact />;
    case "graph": return <GraphArtifact />;
    default: return null;
  }
}

/* ================= CALENDAR ================= */
function CalendarArtifact() {
  const days = ["Mon · 26", "Tue · 27", "Wed · 28", "Thu · 29", "Fri · 30"];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const ROW = 36;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="grid flex-1" style={{ gridTemplateColumns: "44px repeat(5, 1fr)" }}>
        {/* Header row */}
        <div />
        {days.map((d) => (
          <div key={d} className="border-b border-l border-[rgba(26,22,18,0.06)] px-2 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">{d.split(" · ")[0]}</div>
            <div className="font-serif text-[14px] text-[#1A1612]">{d.split(" · ")[1]}</div>
          </div>
        ))}
        {/* Hour rows */}
        {hours.map((h, hi) => (
          <div key={h} className="contents">
            <div className="border-t border-[rgba(26,22,18,0.04)] pr-2 pt-1 text-right font-mono text-[9px] uppercase tracking-[0.1em] text-[#A89C8A]">
              {h}:00
            </div>
            {days.map((_, di) => (
              <div
                key={`${di}-${hi}`}
                className="relative border-l border-t border-[rgba(26,22,18,0.04)]"
                style={{ height: ROW }}
              />
            ))}
          </div>
        ))}
        {/* Event blocks (positioned absolutely over the grid via a single overlay) */}
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div
          className="grid h-full pointer-events-none"
          style={{ gridTemplateColumns: "44px repeat(5, 1fr)", gridTemplateRows: `64px repeat(${hours.length}, ${ROW}px)` }}
        >
          {CALENDAR_EVENTS.map((ev, i) => {
            const top = (ev.hour - hours[0]) * ROW + 64 - 4;
            const height = ev.dur * ROW - 4;
            return (
              <div
                key={i}
                className="pointer-events-auto relative cursor-pointer rounded-[3px] border px-2 py-1.5 text-left transition-all hover:z-10 hover:shadow-md"
                style={{
                  gridColumnStart: ev.day + 2,
                  gridRowStart: 2,
                  marginTop: top - 64 + 2,
                  height,
                  background: ev.unassigned ? "rgba(194,136,64,0.14)" : "rgba(184,84,61,0.08)",
                  borderColor: ev.unassigned ? "#C28840" : "rgba(184,84,61,0.35)",
                  borderLeftWidth: 3,
                  alignSelf: "start"
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="truncate text-[11px] font-medium leading-tight text-[#1A1612]">{ev.title}</div>
                <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-[#5A5450]">
                  {ev.room} · {ev.attendees}p
                </div>
                {hovered === i ? (
                  <div className="absolute left-full top-0 z-20 ml-2 w-[200px] rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white p-3 shadow-lg">
                    <div className="font-serif text-[13px] text-[#1A1612]">{ev.title}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8A7E6F]">
                      {ev.attendees} attendees · {ev.room}
                    </div>
                    <div className="mt-1 text-[11px] text-[#5A5450]">
                      {ev.unassigned ? "⚠ unassigned" : `owner · ${ev.owner}`}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================= ARCH ================= */
function ArchArtifact() {
  const cols = 4;
  const rows = 3;
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const nodeIdx = new Map(ARCH_NODES.map((n) => [n.id, n]));
  const KIND_BG: Record<string, string> = {
    external: "#FAF8F5",
    edge: "rgba(184,84,61,0.10)",
    service: "rgba(59,130,196,0.10)",
    cache: "rgba(194,136,64,0.12)",
    db: "rgba(122,140,95,0.14)",
    queue: "rgba(139,127,212,0.12)"
  };
  const KIND_BORDER: Record<string, string> = {
    external: "rgba(26,22,18,0.18)",
    edge: "#B8543D",
    service: "#3B82C4",
    cache: "#C28840",
    db: "#7A8C5F",
    queue: "#8B7FD4"
  };
  function nodeXY(n: { col: number; row: number }) {
    return { x: n.col * cellW + cellW / 2, y: n.row * cellH + cellH / 2 };
  }
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8A7E6F" />
          </marker>
        </defs>
        {ARCH_EDGES.map((e, i) => {
          const a = nodeIdx.get(e.from);
          const b = nodeIdx.get(e.to);
          if (!a || !b) return null;
          const A = nodeXY(a);
          const B = nodeXY(b);
          return (
            <g key={i}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(26,22,18,0.25)" strokeWidth="0.25" markerEnd="url(#arrow)" />
              <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 1} textAnchor="middle" fontSize="1.6" fontFamily="Geist Mono, monospace" fill="#8A7E6F">
                {e.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0">
        {ARCH_NODES.map((n) => {
          const { x, y } = nodeXY(n);
          return (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[4px] border px-3 py-2 text-center"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: KIND_BG[n.kind] ?? "white",
                borderColor: KIND_BORDER[n.kind] ?? "rgba(26,22,18,0.2)",
                borderLeftWidth: 3,
                minWidth: 110
              }}
            >
              <div className="text-[12px] font-medium text-[#1A1612]">{n.label}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8A7E6F]">{n.kind}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= COMPARE ================= */
function CompareArtifact() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      <div className="grid grid-cols-2 gap-3">
        {[COMPARE_DATA.left, COMPARE_DATA.right].map((side, i) => (
          <div
            key={i}
            className="rounded-[4px] border bg-white"
            style={{
              borderColor: side.tone === "accent" ? "rgba(184,84,61,0.4)" : "rgba(26,22,18,0.08)",
              borderLeftWidth: side.tone === "accent" ? 3 : 1,
              borderLeftColor: side.tone === "accent" ? "#B8543D" : undefined
            }}
          >
            <div className="border-b border-[rgba(26,22,18,0.06)] px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
                {side.tone === "accent" ? "Chosen" : "Alternative"}
              </div>
              <div className="mt-0.5 font-serif text-[18px] text-[#1A1612]">{side.name}</div>
            </div>
            <div className="divide-y divide-[rgba(26,22,18,0.04)]">
              {side.rows.map((r) => (
                <div key={r.k} className="grid grid-cols-[80px_1fr] gap-3 px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A89C8A]">{r.k}</span>
                  <span className="text-[12.5px] text-[#1A1612]">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Verdict</div>
        <div className="mt-1 text-[13px] leading-[1.6] text-[#1A1612]">{COMPARE_DATA.verdict}</div>
      </div>
    </div>
  );
}

/* ================= METRICS ================= */
function MetricsArtifact() {
  const [active, setActive] = useState<number | null>(null);
  const values = METRICS_DATA.series;
  const all = values.flatMap((s) => s.values);
  const max = Math.max(...all);
  const min = Math.min(...all);
  const W = 100;
  const H = 56;
  const xFor = (i: number, len: number) => (i / (len - 1)) * W;
  const yFor = (v: number) => H - ((v - min) / (max - min || 1)) * H;
  const labels = ["May 11", "May 12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "May 24"];

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Hero numbers */}
      <div className="grid grid-cols-3 divide-x divide-[rgba(26,22,18,0.06)] rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white">
        {values.map((s) => {
          const latest = s.values[s.values.length - 1];
          const prev = s.values[s.values.length - 8];
          const delta = (((latest - prev) / prev) * 100).toFixed(1);
          return (
            <div key={s.name} className="px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">{s.name}</div>
              <div className="mt-1 font-serif text-[28px] tracking-tight text-[#1A1612]">{latest}ms</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: Number(delta) >= 0 ? "#9E3B2E" : "#5A6B47" }}>
                {Number(delta) >= 0 ? "↑" : "↓"} {Math.abs(Number(delta))}% · 7d
              </div>
            </div>
          );
        })}
      </div>
      {/* Sparkline */}
      <div className="relative flex-1 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-5">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" onMouseLeave={() => setActive(null)}>
          {values.map((s) => {
            const points = s.values.map((v, i) => `${xFor(i, s.values.length)},${yFor(v)}`).join(" ");
            return (
              <g key={s.name}>
                <polyline points={points} fill="none" stroke={s.color} strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round" />
                {s.values.map((v, i) => (
                  <circle
                    key={i}
                    cx={xFor(i, s.values.length)}
                    cy={yFor(v)}
                    r={active === i ? 0.7 : 0.3}
                    fill={s.color}
                  />
                ))}
              </g>
            );
          })}
          {/* Hover targets */}
          {values[0].values.map((_, i) => (
            <rect
              key={i}
              x={xFor(i, values[0].values.length) - 2}
              y={0}
              width={4}
              height={H}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          ))}
          {active != null ? (
            <line
              x1={xFor(active, values[0].values.length)}
              y1={0}
              x2={xFor(active, values[0].values.length)}
              y2={H}
              stroke="rgba(26,22,18,0.18)"
              strokeWidth="0.2"
              strokeDasharray="0.5,0.5"
            />
          ) : null}
        </svg>
        {/* X axis labels */}
        <div className="absolute inset-x-5 bottom-1 flex justify-between font-mono text-[9px] text-[#A89C8A]">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
        {/* Tooltip */}
        {active != null ? (
          <div className="absolute right-5 top-3 rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">{labels[active]}</div>
            {values.map((s) => (
              <div key={s.name} className="mt-0.5 flex items-center gap-2 text-[11px]">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                <span className="text-[#5A5450]">{s.name}</span>
                <span className="ml-auto font-mono text-[#1A1612]">{s.values[active]}ms</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {/* Callouts */}
      <div className="rounded-[4px] border border-[rgba(194,136,64,0.4)] bg-[rgba(194,136,64,0.08)] px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8C5D1E]">Anomaly · day 10</div>
        <div className="mt-1 text-[12.5px] text-[#1A1612]">{METRICS_DATA.callouts[0].label}</div>
      </div>
    </div>
  );
}

/* ================= ORG ================= */
function OrgArtifact() {
  const lead = ORG_NODES.find((n) => n.kind === "lead")!;
  const ics = ORG_NODES.filter((n) => n.kind === "ic");
  const partners = ORG_NODES.filter((n) => n.kind === "partner");
  const guests = ORG_NODES.filter((n) => n.kind === "guest");

  return (
    <div className="flex h-full flex-col items-center gap-4 overflow-auto py-4">
      {/* Lead */}
      <PersonCard {...lead} size="lg" />
      {/* Line down */}
      <div className="h-6 w-px bg-[rgba(26,22,18,0.16)]" />
      {/* ICs row */}
      <div className="relative flex items-start gap-4">
        <div className="absolute left-4 right-4 top-0 h-px bg-[rgba(26,22,18,0.16)]" />
        {ics.map((p) => (
          <div key={p.id} className="flex flex-col items-center">
            <div className="h-3 w-px bg-[rgba(26,22,18,0.16)]" />
            <PersonCard {...p} size="md" />
          </div>
        ))}
      </div>
      <div className="mt-3 w-full border-t border-dashed border-[rgba(26,22,18,0.16)] pt-4">
        <div className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
          Cross-functional partners
        </div>
        <div className="flex justify-center gap-3">
          {partners.map((p) => <PersonCard key={p.id} {...p} size="sm" />)}
          {guests.map((p) => <PersonCard key={p.id} {...p} size="sm" />)}
        </div>
      </div>
    </div>
  );
}

function PersonCard({ name, role, color, size }: { name: string; role: string; color: string; size: "lg" | "md" | "sm" }) {
  const dims = size === "lg" ? { box: 56, font: 18, w: 200 } : size === "md" ? { box: 40, font: 14, w: 160 } : { box: 32, font: 12, w: 150 };
  return (
    <div className="flex items-center gap-3 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white px-3 py-2" style={{ width: dims.w }}>
      <div
        className="flex items-center justify-center rounded-full font-mono text-white"
        style={{ width: dims.box, height: dims.box, background: color, fontSize: dims.font * 0.55 }}
      >
        {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-[#1A1612]" style={{ fontSize: size === "lg" ? 14 : 13 }}>{name}</div>
        <div className="truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8A7E6F]">{role}</div>
      </div>
    </div>
  );
}

/* ================= DECISIONS ================= */
function DecisionsArtifact() {
  const KIND_TONE: Record<string, { dot: string; label: string }> = {
    trigger:  { dot: "#C28840", label: "Trigger" },
    research: { dot: "#5E7A8C", label: "Research" },
    design:   { dot: "#7A8C5F", label: "Design" },
    decision: { dot: "#B8543D", label: "Decision" }
  };
  return (
    <div className="relative h-full overflow-auto pl-10 pr-4 py-2">
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[rgba(26,22,18,0.12)]" />
      <div className="space-y-4">
        {DECISIONS.map((d, i) => {
          const t = KIND_TONE[d.kind];
          return (
            <div key={i} className="relative">
              <div
                className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-[#FAF8F5]"
                style={{ background: t.dot }}
              />
              <div className="rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: t.dot }}>
                    {t.label} · {d.date}
                  </div>
                  <div className="font-mono text-[10px] text-[#A89C8A]">{d.who}</div>
                </div>
                <h4 className="mt-1 font-serif text-[16px] text-[#1A1612]">{d.title}</h4>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-[#5A5450]">{d.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= DOC ================= */
function DocArtifact() {
  return (
    <div className="h-full overflow-auto px-1">
      <div className="mb-4 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
          {RFC_DOC.status} · {RFC_DOC.author}
        </div>
        <h2 className="mt-2 font-serif text-[28px] leading-tight text-[#1A1612]">{RFC_DOC.title}</h2>
      </div>
      {RFC_DOC.sections.map((s, i) => (
        <article key={i} className="mb-3 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">{String(i + 1).padStart(2, "0")} · {s.heading}</h3>
          <p className="mt-2 font-serif text-[14px] leading-[1.7] text-[#1A1612]">{s.body}</p>
        </article>
      ))}
    </div>
  );
}

/* ================= CODE ================= */
function CodeArtifact() {
  const [copied, setCopied] = useState(false);
  const lines = CODE_SAMPLE.split("\n");

  function highlight(line: string) {
    // tasteful, terse syntax tokenization
    const keywords = ["import", "from", "export", "function", "const", "let", "var", "return", "type", "if", "else", "await", "async", "new"];
    const tokens: { text: string; cls: string }[] = [];
    const regex = /(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|([A-Za-z_$][\w$]*)|(\s+)|([{}()\[\];,.=<>+\-*/&|!?:])/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
      if (m[1]) tokens.push({ text: m[1], cls: "text-[#7A8C5F]" });
      else if (m[2]) tokens.push({ text: m[2], cls: "text-[#8C5D1E]" });
      else if (m[3]) tokens.push({
        text: m[3],
        cls: keywords.includes(m[3]) ? "text-[#B8543D]" : /^[A-Z]/.test(m[3]) ? "text-[#5E7A8C]" : "text-[#1A1612]"
      });
      else if (m[5]) tokens.push({ text: m[5], cls: "text-[#8A7E6F]" });
      else tokens.push({ text: m[0], cls: "text-[#1A1612]" });
    }
    return tokens;
  }

  return (
    <div className="flex h-full flex-col rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white">
      <div className="flex items-center justify-between border-b border-[rgba(26,22,18,0.06)] bg-[#FAF8F5] px-4 py-2">
        <span className="font-mono text-[11px] text-[#5A5450]">rate-limiter.ts</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(CODE_SAMPLE);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5A5450] hover:bg-[#FAF8F5]"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="px-4 py-3 font-mono text-[12px] leading-[1.7]">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-3 inline-block w-6 select-none text-right text-[#A89C8A]">{i + 1}</span>
              <code className="flex-1 whitespace-pre">
                {highlight(line).map((t, j) => <span key={j} className={t.cls}>{t.text}</span>)}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ================= GRAPH ================= */
function GraphArtifact() {
  const nodes = GRAPH_DATA.nodes;
  const edges = GRAPH_DATA.edges;
  const positions = nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    return { ...n, x: 50 + Math.cos(angle) * 30, y: 50 + Math.sin(angle) * 30 };
  });
  // Center the hub (northstar) in the middle
  const center = positions.find((p) => p.id === "northstar");
  if (center) {
    center.x = 50;
    center.y = 50;
  }
  const idx = new Map(positions.map((p) => [p.id, p]));
  const [hover, setHover] = useState<string | null>(null);

  const KIND: Record<string, string> = {
    platform: "#B8543D",
    product: "#3B82C4",
    customer: "#8B7FD4",
    service: "#7A8C5F",
    library: "#C28840"
  };

  const connected = new Set<string>();
  if (hover) {
    connected.add(hover);
    for (const e of edges) {
      if (e.from === hover) connected.add(e.to);
      if (e.to === hover) connected.add(e.from);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {edges.map((e, i) => {
          const a = idx.get(e.from);
          const b = idx.get(e.to);
          if (!a || !b) return null;
          const dim = hover && !(connected.has(e.from) && connected.has(e.to));
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={dim ? "rgba(26,22,18,0.06)" : "rgba(26,22,18,0.2)"}
              strokeWidth={e.strength * 0.18}
            />
          );
        })}
        {positions.map((p) => {
          const dim = hover && !connected.has(p.id);
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
              opacity={dim ? 0.3 : 1}
            >
              <circle cx={p.x} cy={p.y} r={p.weight * 0.18} fill={KIND[p.kind]} />
              <text x={p.x} y={p.y + p.weight * 0.18 + 2.5} textAnchor="middle" fontSize="1.9" fontFamily="Geist, sans-serif" fill="#1A1612">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5450]">
        {Object.entries(KIND).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
