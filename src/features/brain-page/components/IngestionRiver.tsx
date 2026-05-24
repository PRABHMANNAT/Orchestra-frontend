import { useEffect, useRef } from "react";
import { INGESTION_FLOWS, SOURCES } from "../data/mockBrainData";

export function IngestionRiver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let width = 0;
    let height = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sourcesWithFlows = INGESTION_FLOWS.map((f) => {
      const meta = SOURCES.find((s) => s.id === f.sourceId);
      return { ...f, name: meta?.name ?? f.sourceId };
    });

    // dot positions along each line (only for active flows)
    const dots = sourcesWithFlows.map(() => ({ t: Math.random() }));

    function resize() {
      const rect = wrap!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = rect.width + "px";
      canvas!.style.height = rect.height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const brainX = width - 80;
      const brainY = height / 2;
      const leftPad = 110;
      const rowH = height / (sourcesWithFlows.length + 1);

      // draw brain target
      ctx!.beginPath();
      ctx!.arc(brainX, brainY, 28, 0, Math.PI * 2);
      ctx!.fillStyle = "#F5F1EB";
      ctx!.strokeStyle = "rgba(184,84,61,0.4)";
      ctx!.lineWidth = 1.5;
      ctx!.fill();
      ctx!.stroke();
      ctx!.fillStyle = "#B8543D";
      ctx!.font = "600 11px Geist, sans-serif";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText("BRAIN", brainX, brainY);

      sourcesWithFlows.forEach((src, i) => {
        const sx = leftPad;
        const sy = rowH * (i + 1);
        const cx1 = (sx + brainX) / 2;
        const cy1 = sy;
        const cx2 = (sx + brainX) / 2;
        const cy2 = brainY;

        // line
        ctx!.beginPath();
        ctx!.moveTo(sx, sy);
        ctx!.bezierCurveTo(cx1, cy1, cx2, cy2, brainX - 28, brainY);
        ctx!.strokeStyle = src.active ? "rgba(184,84,61,0.45)" : "rgba(26,22,18,0.08)";
        ctx!.lineWidth = src.active ? 1.4 : 0.8;
        ctx!.stroke();

        // origin dot
        ctx!.beginPath();
        ctx!.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx!.fillStyle = src.active ? "#B8543D" : "#A89C8A";
        ctx!.fill();

        // label
        ctx!.fillStyle = "#5A5450";
        ctx!.font = "500 11px Geist, sans-serif";
        ctx!.textAlign = "right";
        ctx!.textBaseline = "middle";
        ctx!.fillText(src.name, sx - 10, sy);

        // moving dot
        if (src.active && !reduced) {
          const t = dots[i].t;
          // cubic bezier point
          const x =
            (1 - t) ** 3 * sx + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * (brainX - 28);
          const y =
            (1 - t) ** 3 * sy + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * brainY;
          ctx!.beginPath();
          ctx!.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = "#B8543D";
          ctx!.fill();
          dots[i].t += 0.003 + (i % 3) * 0.0008;
          if (dots[i].t > 1) dots[i].t = 0;
        }
      });
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

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
      <div ref={wrapRef} className="relative h-[220px] rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </section>
  );
}
