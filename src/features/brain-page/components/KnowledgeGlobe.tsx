import { useEffect, useMemo, useRef, useState } from "react";
import { DOMAINS, type Domain, type DomainId } from "../data/mockBrainData";

type GlobeProps = {
  selectedDomain: DomainId | null;
  onSelectDomain: (id: DomainId | null) => void;
};

/* ============ utilities ============ */

function hashString(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

function seedRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function angularDistance(lonA: number, latA: number, lonB: number, latB: number) {
  const toRad = Math.PI / 180;
  const aLat = latA * toRad;
  const bLat = latB * toRad;
  const dLon = (lonA - lonB) * toRad;
  const dot = Math.sin(aLat) * Math.sin(bLat) + Math.cos(aLat) * Math.cos(bLat) * Math.cos(dLon);
  return Math.acos(clamp(dot, -1, 1)) / toRad;
}

/* ============ domain centers (deterministic placement around the sphere) ============ */

type DomainCenter = Domain & { lon: number; lat: number };

const DOMAIN_CENTERS: DomainCenter[] = (() => {
  // Hand-tuned positions so the bigger continents face the viewer when idle.
  const positions: Record<DomainId, { lon: number; lat: number }> = {
    engineering: { lon: -25, lat: 28 },
    northstar: { lon: 35, lat: 12 },
    sales: { lon: 95, lat: 42 },
    apollo: { lon: -110, lat: 8 },
    design: { lon: -65, lat: -22 },
    onboarding: { lon: 145, lat: -10 },
    acme: { lon: 60, lat: -38 },
    legal: { lon: -160, lat: 52 }
  };
  return DOMAINS.map((d) => ({ ...d, ...positions[d.id] }));
})();

/* ============ Voronoi-style coverage cells, colored by closest domain ============ */

type CoverageCell = {
  id: string;
  domainId: DomainId;
  color: string;
  points: { lon: number; lat: number }[];
  strength: number;
};

const COVERAGE_CELLS: CoverageCell[] = (() => {
  const cells: CoverageCell[] = [];
  const lonStep = 18;
  const latStep = 15;

  const totalDocs = DOMAINS.reduce((s, d) => s + d.docCount, 0);

  for (let lat = -90; lat < 90; lat += latStep) {
    for (let lon = -180; lon < 180; lon += lonStep) {
      const centerLon = lon + lonStep / 2;
      const centerLat = lat + latStep / 2;
      let owner = DOMAIN_CENTERS[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const dc of DOMAIN_CENTERS) {
        const noise = (seedRandom(hashString(`${lon}:${lat}:${dc.id}`))() - 0.5) * 22;
        // bigger domains pull territory; weight by sqrt of doc share
        const pull = (dc.docCount / totalDocs) * 90;
        const score = angularDistance(centerLon, centerLat, dc.lon, dc.lat) + noise - pull;
        if (score < bestScore) {
          owner = dc;
          bestScore = score;
        }
      }

      cells.push({
        id: `${lon}:${lat}`,
        domainId: owner.id,
        color: owner.color,
        points: [
          { lon, lat },
          { lon: lon + lonStep, lat },
          { lon: lon + lonStep, lat: lat + latStep },
          { lon, lat: lat + latStep }
        ],
        strength: clamp(1 - bestScore / 110, 0.45, 1)
      });
    }
  }

  return cells;
})();

/* ============ landmark pins (top contributors per domain) ============ */

type Landmark = {
  domainId: DomainId;
  name: string;
  initials: string;
  lon: number;
  lat: number;
  color: string;
};

const LANDMARKS: Landmark[] = DOMAIN_CENTERS.flatMap((dc) => {
  const rng = seedRandom(hashString(dc.id));
  return dc.contributors.slice(0, 3).map((name) => {
    const initials = name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return {
      domainId: dc.id,
      name,
      initials,
      lon: dc.lon + (rng() - 0.5) * 28,
      lat: clamp(dc.lat + (rng() - 0.5) * 24, -75, 75),
      color: dc.color
    };
  });
});

/* ============ component ============ */

export function KnowledgeGlobe({ selectedDomain, onSelectDomain }: GlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 460, h: 460 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const size = Math.min(box.w, box.h);
  const r = size * 0.42;
  const cx = box.w / 2;
  const cy = box.h / 2;
  const TILT = 20;

  const [rot, setRot] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hoverDomain, setHoverDomain] = useState<DomainId | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ x: 0, rot: 0 });
  const rotRef = useRef(0);
  rotRef.current = rot;

  // Auto-rotate when not dragging
  useEffect(() => {
    if (dragging) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setRot((rr) => rr + dt * 0.010);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const onDown = (clientX: number) => {
    setDragging(true);
    dragRef.current = { x: clientX, rot: rotRef.current };
  };
  const onMove = (clientX: number) => {
    if (!dragging) return;
    const dx = clientX - dragRef.current.x;
    setRot(dragRef.current.rot + dx * 0.55);
  };
  const onUp = () => setDragging(false);

  const tilt = (TILT * Math.PI) / 180;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const project = (lon: number, lat: number) => {
    const lonR = ((lon + rot) * Math.PI) / 180;
    const latR = (lat * Math.PI) / 180;
    const cosLat = Math.cos(latR);
    const x = cosLat * Math.sin(lonR);
    const y = Math.sin(latR);
    const z = cosLat * Math.cos(lonR);
    const y2 = y * cosT - z * sinT;
    const z2 = y * sinT + z * cosT;
    return { sx: cx + x * r, sy: cy - y2 * r, z: z2 };
  };

  const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
  const parallels = [-60, -30, 0, 30, 60];

  const topThree = useMemo(() => [...DOMAINS].sort((a, b) => b.docCount - a.docCount).slice(0, 3), []);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Knowledge World</span>
        {selectedDomain ? (
          <button
            type="button"
            onClick={() => onSelectDomain(null)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B8543D] hover:text-[#8C3E28]"
          >
            Clear filter
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">drag to rotate</span>
        )}
      </div>

      <div
        ref={wrapRef}
        className="relative flex-1 select-none overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)]"
        style={{
          background: "radial-gradient(circle at 50% 48%, #F2E8D7 0%, #E5D6BD 60%, #D6C3A4 100%)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none"
        }}
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => {
          onMove(e.clientX);
          // hover tracking
          const rect = wrapRef.current?.getBoundingClientRect();
          if (rect) setHoverPos({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => {
          onUp();
          setHoverDomain(null);
          setHoverPos(null);
        }}
        onMouseUp={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onUp}
      >
        <svg
          width={box.w}
          height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
          role="img"
          aria-label="Knowledge world — drag to rotate"
        >
          <defs>
            <linearGradient id="kw-field" x1="10%" y1="8%" x2="92%" y2="95%">
              {DOMAIN_CENTERS.map((d, i) => (
                <stop
                  key={d.id}
                  offset={`${(i / Math.max(1, DOMAIN_CENTERS.length - 1)) * 100}%`}
                  stopColor={d.color}
                />
              ))}
            </linearGradient>
            <radialGradient id="kw-shade" cx="65%" cy="68%" r="55%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(26,22,18,0.22)" />
            </radialGradient>
            <radialGradient id="kw-highlight" cx="30%" cy="24%" r="58%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="52%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="kw-atmosphere" cx="50%" cy="50%" r="50%">
              <stop offset="92%" stopColor="rgba(232,221,208,0)" />
              <stop offset="100%" stopColor="rgba(232,221,208,0.5)" />
            </radialGradient>
            <clipPath id="kw-clip">
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
          </defs>

          {/* atmosphere */}
          <circle cx={cx} cy={cy} r={r * 1.08} fill="url(#kw-atmosphere)" />

          {/* sphere base */}
          <circle cx={cx} cy={cy} r={r} fill="url(#kw-field)" stroke="rgba(26,22,18,0.18)" strokeWidth={1.2} />

          {/* coverage cells (domain ownership) */}
          <g clipPath="url(#kw-clip)">
            {COVERAGE_CELLS.map((cell) => {
              const projected = cell.points.map((p) => project(p.lon, p.lat));
              const avgZ = projected.reduce((s, p) => s + p.z, 0) / projected.length;
              if (avgZ < -0.3) return null;
              const depth = clamp((avgZ + 0.3) / 1.3, 0, 1);
              const path =
                projected
                  .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
                  .join(" ") + " Z";
              const isSelected = selectedDomain === cell.domainId;
              const isDimmed = selectedDomain && !isSelected;
              const cellOpacity = (isDimmed ? 0.18 : 0.7 + cell.strength * 0.18) * (0.74 + depth * 0.28);

              return (
                <path
                  key={cell.id}
                  d={path}
                  fill={cell.color}
                  opacity={cellOpacity}
                  stroke={cell.color}
                  strokeOpacity={isDimmed ? 0.16 : 0.5}
                  strokeWidth={0.7}
                  strokeLinejoin="round"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    setHoverDomain(cell.domainId);
                    setHoverPos({ x: e.clientX, y: e.clientY });
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDomain(selectedDomain === cell.domainId ? null : cell.domainId);
                  }}
                />
              );
            })}
          </g>

          {/* graticule — meridians */}
          {meridians.map((L) => {
            const pts: { sx: number; sy: number; z: number }[] = [];
            for (let lat = -90; lat <= 90; lat += 6) pts.push(project(L, lat));
            const visible = pts.filter((p) => p.z > -0.05);
            if (visible.length < 2) return null;
            const path = visible
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
              .join(" ");
            return (
              <path
                key={`m${L}`}
                d={path}
                stroke="rgba(255,255,255,0.42)"
                strokeWidth={0.6}
                fill="none"
                opacity={0.8}
              />
            );
          })}

          {/* graticule — parallels */}
          {parallels.map((lat) => {
            const pts: { sx: number; sy: number; z: number }[] = [];
            for (let lon = -180; lon <= 180; lon += 6) pts.push(project(lon, lat));
            const visible = pts.filter((p) => p.z > -0.05);
            if (visible.length < 2) return null;
            const path = visible
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`)
              .join(" ");
            return (
              <path
                key={`pa${lat}`}
                d={path}
                stroke="rgba(255,255,255,0.42)"
                strokeWidth={0.6}
                fill="none"
                opacity={0.8}
              />
            );
          })}

          {/* lighting */}
          <circle cx={cx} cy={cy} r={r} fill="url(#kw-shade)" pointerEvents="none" />
          <circle cx={cx} cy={cy} r={r} fill="url(#kw-highlight)" pointerEvents="none" />

          {/* domain labels — float over the continent center when visible */}
          {DOMAIN_CENTERS.map((dc) => {
            const p = project(dc.lon, dc.lat);
            if (p.z < -0.1) return null;
            const isSelected = selectedDomain === dc.id;
            const isDimmed = selectedDomain && !isSelected;
            const opacity = isDimmed ? 0.32 : 1;
            return (
              <g key={`lbl-${dc.id}`} pointerEvents="none" opacity={opacity}>
                <text
                  x={p.sx}
                  y={p.sy}
                  textAnchor="middle"
                  fontFamily="Fraunces, ui-serif, Georgia, serif"
                  fontSize={11}
                  fontWeight={500}
                  fill="#1A1612"
                  stroke="rgba(245,241,235,0.7)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {dc.name}
                </text>
              </g>
            );
          })}

          {/* landmark pins — top contributors per domain */}
          {LANDMARKS.map((lm, i) => {
            const p = project(lm.lon, lm.lat);
            if (p.z < -0.15) return null;
            const isSelected = selectedDomain === lm.domainId;
            const isDimmed = selectedDomain && !isSelected;
            const depthOpacity = clamp((p.z + 0.45) / 1.45, 0.4, 1);
            return (
              <g key={`lm-${i}`} opacity={isDimmed ? 0.2 : depthOpacity} pointerEvents="none">
                <circle cx={p.sx} cy={p.sy} r={2.6} fill="#FAF8F5" stroke={lm.color} strokeWidth={1} />
              </g>
            );
          })}
        </svg>

        {/* tooltip */}
        {hoverDomain && hoverPos ? (
          <DomainTooltip
            domain={DOMAIN_CENTERS.find((d) => d.id === hoverDomain)!}
            x={hoverPos.x}
            y={hoverPos.y}
          />
        ) : null}

        {/* footnote */}
        <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5A5450]">
          {DOMAINS.reduce((s, d) => s + d.docCount, 0).toLocaleString()} memories · 8 continents
        </div>
      </div>

      {/* top continents */}
      <div className="mt-3 grid gap-1.5">
        {topThree.map((domain, idx) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => onSelectDomain(selectedDomain === domain.id ? null : domain.id)}
            className="flex items-center justify-between gap-4 rounded-[3px] px-1 py-1 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[#5A5450] transition-colors hover:bg-[rgba(255,255,255,0.42)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-[#A89C8A]">{String(idx + 1).padStart(2, "0")}</span>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: domain.color }} />
              <span className="truncate">{domain.name}</span>
            </span>
            <span className="text-[#8A7E6F]">{domain.docCount} memories</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DomainTooltip({ domain, x, y }: { domain: DomainCenter; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-2 shadow-sm"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="font-serif text-[13px] text-[#1A1612]">{domain.name}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">
        {domain.docCount} memories
      </div>
      <div className="mt-1 font-mono text-[10px] text-[#8A7E6F]">
        Updated {new Date(domain.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </div>
      <div className="mt-1 max-w-[220px] text-[11px] leading-[1.35] text-[#5A5450]">
        {domain.contributors.slice(0, 3).join(" · ")}
      </div>
    </div>
  );
}
