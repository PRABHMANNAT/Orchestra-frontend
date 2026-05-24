import { Vector3 } from "three";

export function sphericalToCartesian(latDeg: number, lngDeg: number, radius: number): Vector3 {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;
  return new Vector3(radius * Math.cos(lat) * Math.cos(lng), radius * Math.sin(lat), radius * Math.cos(lat) * Math.sin(lng));
}
