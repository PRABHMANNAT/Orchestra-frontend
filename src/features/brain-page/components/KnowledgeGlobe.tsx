import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DOMAINS, type Domain, type DomainId } from "../data/mockBrainData";

type GlobeProps = {
  selectedDomain: DomainId | null;
  onSelectDomain: (id: DomainId | null) => void;
};

type Lobe = {
  center: THREE.Vector3;
  size: number;
};

type Placement = {
  domain: Domain;
  center: THREE.Vector3;
  angularSize: number;
  lobes: Lobe[];
};

const RADIUS = 1.58;
const ROTATION_SPEED = (Math.PI * 2) / 60;

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function tangentBasis(center: THREE.Vector3) {
  const up = Math.abs(center.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const axisA = new THREE.Vector3().crossVectors(up, center).normalize();
  const axisB = new THREE.Vector3().crossVectors(center, axisA).normalize();
  return { axisA, axisB };
}

function surfaceNoise(dir: THREE.Vector3, seed: number) {
  const value = Math.sin((dir.x * 18.93 + dir.y * 47.21 + dir.z * 31.77 + seed * 0.13) * 19.17) * 999.7;
  return value - Math.floor(value);
}

function makeLobe(center: THREE.Vector3, baseSize: number, seed: number, index: number): Lobe {
  if (index === 0) return { center: center.clone(), size: baseSize * 0.94 };
  const { axisA, axisB } = tangentBasis(center);
  const angle = seededUnit(seed + index * 17) * Math.PI * 2;
  const spread = baseSize * (0.22 + seededUnit(seed + index * 23) * 0.42);
  const size = baseSize * (0.48 + seededUnit(seed + index * 31) * 0.3);
  const shifted = center
    .clone()
    .multiplyScalar(Math.cos(spread))
    .add(axisA.clone().multiplyScalar(Math.sin(spread) * Math.cos(angle)))
    .add(axisB.clone().multiplyScalar(Math.sin(spread) * Math.sin(angle)))
    .normalize();
  return { center: shifted, size };
}

function continentPlacements(): Placement[] {
  const total = DOMAINS.reduce((sum, domain) => sum + domain.docCount, 0);
  const golden = Math.PI * (3 - Math.sqrt(5));

  return DOMAINS.map((domain, index) => {
    const y = 1 - (index / (DOMAINS.length - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * index + 0.42;
    const center = new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).normalize();
    const angularSize = Math.sqrt(domain.docCount / total) * 1.55 + 0.22;
    const seed = hashString(domain.id);
    const lobes = Array.from({ length: 5 }, (_, lobeIndex) => makeLobe(center, angularSize, seed, lobeIndex));
    return { domain, center, angularSize, lobes };
  });
}

const PLACEMENTS = continentPlacements();

function findDomainAtDirection(direction: THREE.Vector3) {
  let best: { placement: Placement; strength: number } | null = null;

  for (const placement of PLACEMENTS) {
    const seed = hashString(placement.domain.id);
    for (const lobe of placement.lobes) {
      const dot = Math.max(-1, Math.min(1, direction.dot(lobe.center)));
      const angle = Math.acos(dot);
      const raggedEdge = 0.9 + surfaceNoise(direction, seed) * 0.22;
      const limit = lobe.size * raggedEdge;
      if (angle < limit) {
        const strength = 1 - angle / limit;
        if (!best || strength > best.strength) {
          best = { placement, strength };
        }
      }
    }
  }

  return best;
}

function buildPins() {
  const pins: { pos: THREE.Vector3; domainId: DomainId }[] = [];

  for (const placement of PLACEMENTS) {
    const seed = hashString(placement.domain.id);
    const count = Math.max(8, Math.min(34, Math.round(placement.domain.docCount / 11)));

    for (let pinIndex = 0; pinIndex < count; pinIndex++) {
      const lobe = placement.lobes[pinIndex % placement.lobes.length];
      const { axisA, axisB } = tangentBasis(lobe.center);
      const angle = lobe.size * 0.68 * Math.sqrt(seededUnit(seed + pinIndex * 19 + 7));
      const phi = seededUnit(seed + pinIndex * 29 + 3) * Math.PI * 2;
      const direction = lobe.center
        .clone()
        .multiplyScalar(Math.cos(angle))
        .add(axisA.clone().multiplyScalar(Math.sin(angle) * Math.cos(phi)))
        .add(axisB.clone().multiplyScalar(Math.sin(angle) * Math.sin(phi)))
        .normalize();

      pins.push({ pos: direction.multiplyScalar(RADIUS * 1.014), domainId: placement.domain.id });
    }
  }

  return pins;
}

function Sphere({
  selectedDomain,
  onSelectDomain,
  reducedMotion,
  setHover
}: GlobeProps & {
  reducedMotion: boolean;
  setHover: (hover: { domain: Domain; x: number; y: number } | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useFrame((_, delta) => {
    if (!reducedMotion && autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  const geometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(RADIUS, 96, 60);
    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const oceanDeep = new THREE.Color("#D8C5AE");
    const oceanLight = new THREE.Color("#EBDDC9");
    const shelf = new THREE.Color("#C9B69A");
    const tmp = new THREE.Vector3();

    for (let index = 0; index < pos.count; index++) {
      tmp.set(pos.getX(index), pos.getY(index), pos.getZ(index)).normalize();
      const domainHit = findDomainAtDirection(tmp);

      // Latitude banding: subtle warmer ocean at equator, cooler/lighter at poles
      const lat = Math.abs(tmp.y); // 0 at equator, 1 at poles
      const oceanBand = oceanDeep.clone().lerp(oceanLight, lat * 0.55 + 0.15);

      // tiny per-vertex noise so ocean isn't perfectly smooth
      const grain = surfaceNoise(tmp, 0) * 0.04 - 0.02;
      oceanBand.offsetHSL(0, 0, grain);

      const color = domainHit
        ? oceanBand
            .clone()
            .lerp(shelf, 0.18)
            .lerp(new THREE.Color(domainHit.placement.domain.color), 0.62 + domainHit.strength * 0.28)
        : oceanBand;

      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  const pins = useMemo(() => buildPins(), []);

  function getDomainFromPoint(point: THREE.Vector3) {
    const local = point.clone();
    if (groupRef.current) {
      groupRef.current.worldToLocal(local);
    }
    local.normalize();
    return findDomainAtDirection(local)?.placement.domain ?? null;
  }

  return (
    <group ref={groupRef}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={(event) => {
          event.stopPropagation();
          const domain = getDomainFromPoint(event.point);
          if (domain) {
            setHover({ domain, x: event.clientX, y: event.clientY });
            setAutoRotate(false);
            return;
          }
          setHover(null);
          setAutoRotate(true);
        }}
        onPointerOut={() => {
          setHover(null);
          setAutoRotate(true);
        }}
        onClick={(event) => {
          event.stopPropagation();
          const domain = getDomainFromPoint(event.point);
          onSelectDomain(domain && selectedDomain !== domain.id ? domain.id : null);
        }}
      >
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} flatShading={false} />
      </mesh>

      {/* Faint latitude/longitude grid - very subtle */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.0025, 36, 22]} />
        <meshBasicMaterial color="#8A7E6F" wireframe transparent opacity={0.04} />
      </mesh>

      {/* Outer atmospheric halo */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.045, 48, 32]} />
        <meshBasicMaterial color="#E8DDD0" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[RADIUS * 1.085, 48, 32]} />
        <meshBasicMaterial color="#E8DDD0" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Continent labels — borderless, just letter-spaced serif */}
      {PLACEMENTS.map((placement) => (
        <Html
          key={placement.domain.id}
          position={placement.center.clone().multiplyScalar(RADIUS * 1.18).toArray()}
          center
          distanceFactor={4.7}
          occlude
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              color: "#1A1612",
              fontFamily: "Fraunces, ui-serif, Georgia, serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              lineHeight: "1",
              opacity: selectedDomain && selectedDomain !== placement.domain.id ? 0.28 : 0.94,
              padding: "2px 6px",
              transition: "opacity 220ms ease",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px rgba(245,241,235,0.85), 0 0 6px rgba(245,241,235,0.6)"
            }}
          >
            {placement.domain.name}
          </div>
        </Html>
      ))}

      {/* Pin dots — warm amber on selected continent, cream otherwise */}
      {pins.map((pin, index) => {
        const isSelected = selectedDomain === pin.domainId;
        const isDim = selectedDomain && !isSelected;
        return (
          <mesh key={`${pin.domainId}-${index}`} position={pin.pos.toArray()}>
            <sphereGeometry args={[isSelected ? 0.014 : 0.011, 6, 6]} />
            <meshBasicMaterial
              color={isSelected ? "#F5C77E" : isDim ? "#8A7E6F" : "#FAF1DC"}
              transparent
              opacity={isDim ? 0.22 : 0.92}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Starfield() {
  const points = useMemo(() => {
    const count = 220;
    const arr = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) {
      const r = 8.2 + seededUnit(index + 101) * 4.4;
      const theta = seededUnit(index + 211) * Math.PI * 2;
      const phi = Math.acos(2 * seededUnit(index + 307) - 1);
      arr[index * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[index * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[index * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} count={220} />
      </bufferGeometry>
      <pointsMaterial size={0.016} color="#8A7E6F" transparent opacity={0.22} sizeAttenuation />
    </points>
  );
}

export function KnowledgeGlobe({ selectedDomain, onSelectDomain }: GlobeProps) {
  const [hover, setHover] = useState<{ domain: Domain; x: number; y: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const topDomains = useMemo(() => [...DOMAINS].sort((a, b) => b.docCount - a.docCount).slice(0, 3), []);

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
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">drag / scroll / click</span>
        )}
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)]"
        style={{
          // soft radial vignette behind the globe for depth
          background:
            "radial-gradient(circle at 50% 48%, #F2E8D7 0%, #E8DBC5 55%, #DCCBAF 100%)"
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 4.35], fov: 36 }}
          dpr={[1, 1.6]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.62} />
          <directionalLight position={[3.5, 2.6, 4.2]} intensity={0.88} color="#FFF6E5" />
          <directionalLight position={[-3.2, -2.4, -1.8]} intensity={0.22} color="#C9D6E2" />
          {/* warm rim light for sunset feel on the edge */}
          <pointLight position={[-2.4, 0.4, 3.0]} intensity={0.35} color="#F5C77E" distance={9} />
          <Starfield />
          <Sphere
            selectedDomain={selectedDomain}
            onSelectDomain={onSelectDomain}
            reducedMotion={reducedMotion}
            setHover={setHover}
          />
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={3}
            maxDistance={6.6}
            rotateSpeed={0.55}
            zoomSpeed={0.38}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>

        {hover ? (
          <div
            className="pointer-events-none fixed z-50 rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-2 shadow-sm"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            <div className="font-serif text-[13px] text-[#1A1612]">{hover.domain.name}</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">
              {hover.domain.docCount} memories
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#8A7E6F]">
              Updated {new Date(hover.domain.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div className="mt-1 max-w-[220px] text-[11px] leading-[1.35] text-[#5A5450]">
              {hover.domain.contributors.slice(0, 3).join(" · ")}
            </div>
          </div>
        ) : null}

        {reducedMotion ? (
          <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8A7E6F]">
            reduced motion
          </div>
        ) : null}

        {/* Quiet compass marker — bottom right */}
        <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#A89C8A]">
          1,247 memories · 8 continents
        </div>
      </div>

      <div className="mt-3 grid gap-1.5">
        {topDomains.map((domain, index) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => onSelectDomain(selectedDomain === domain.id ? null : domain.id)}
            className="flex items-center justify-between gap-4 rounded-[3px] px-1 py-1 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-[#5A5450] transition-colors hover:bg-[rgba(255,255,255,0.42)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-[#A89C8A]">{String(index + 1).padStart(2, "0")}</span>
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
