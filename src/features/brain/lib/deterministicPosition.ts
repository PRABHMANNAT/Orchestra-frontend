import type { BrainCategory } from "../brain.types";
import { fibonacciSphere } from "./fibonacciSphere";

const CATEGORY_BANDS: Record<BrainCategory, { lat: [number, number]; lng: [number, number] }> = {
  doc: { lat: [-20, 40], lng: [-120, -30] },
  decision: { lat: [30, 70], lng: [20, 100] },
  comms: { lat: [-50, -10], lng: [40, 140] },
  team: { lat: [10, 50], lng: [-60, 20] },
  change: { lat: [-30, 20], lng: [100, 180] }
};

function hashId(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function deterministicPosition(id: string, category: BrainCategory, index: number, count: number) {
  const band = CATEGORY_BANDS[category];
  const distributed = fibonacciSphere(index, count);
  const hash = hashId(id);
  const latT = (distributed.lat + 90) / 180;
  const lngT = (distributed.lng + 180) / 360;
  const jitterLat = (((hash & 255) / 255) - 0.5) * 8;
  const jitterLng = ((((hash >> 8) & 255) / 255) - 0.5) * 10;
  const lat = band.lat[0] + (band.lat[1] - band.lat[0]) * latT + jitterLat;
  const lng = band.lng[0] + (band.lng[1] - band.lng[0]) * lngT + jitterLng;

  return {
    lat: Math.max(-72, Math.min(72, lat)),
    lng: ((lng + 540) % 360) - 180
  };
}
