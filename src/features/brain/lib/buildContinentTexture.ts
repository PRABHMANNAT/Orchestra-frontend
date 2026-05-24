import * as THREE from "three";
import type { BrainCategory, BrainNode } from "../brain.types";
import { brainTokens } from "../tokens";

const CATEGORIES: BrainCategory[] = ["doc", "decision", "comms", "team", "change"];

function toCanvasPoint(lat: number, lng: number, width: number, height: number) {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height
  };
}

function paintBlob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, seed: number) {
  ctx.save();
  ctx.filter = "blur(40px)";
  ctx.fillStyle = color;
  ctx.beginPath();

  const points = 10;
  for (let index = 0; index <= points; index += 1) {
    const angle = (Math.PI * 2 * index) / points;
    const wobble = 0.82 + 0.16 * Math.sin(seed + index * 1.7);
    const px = x + Math.cos(angle) * rx * wobble;
    const py = y + Math.sin(angle) * ry * (0.78 + 0.12 * Math.cos(seed + index));
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      const previousAngle = (Math.PI * 2 * (index - 0.5)) / points;
      const cx = x + Math.cos(previousAngle) * rx * 0.95;
      const cy = y + Math.sin(previousAngle) * ry * 0.85;
      ctx.quadraticCurveTo(cx, cy, px, py);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function buildContinentTexture(nodes: BrainNode[]) {
  const lowDpr = typeof window !== "undefined" && window.devicePixelRatio < 1.5;
  const width = lowDpr ? 1024 : 2048;
  const height = lowDpr ? 512 : 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.clearRect(0, 0, width, height);

  CATEGORIES.forEach((category, categoryIndex) => {
    const categoryNodes = nodes.filter((node) => node.category === category && node.position);
    if (!categoryNodes.length) {
      return;
    }

    const avgLat = categoryNodes.reduce((sum, node) => sum + node.position!.lat, 0) / categoryNodes.length;
    const avgLng = categoryNodes.reduce((sum, node) => sum + node.position!.lng, 0) / categoryNodes.length;
    const center = toCanvasPoint(avgLat, avgLng, width, height);
    const spread = Math.max(34, Math.min(58, 28 + categoryNodes.length * 4));
    const rx = (spread / 360) * width;
    const ry = (spread / 180) * height;

    paintBlob(ctx, center.x, center.y, rx, ry, brainTokens.continent[category], categoryIndex * 2.1 + categoryNodes.length);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
