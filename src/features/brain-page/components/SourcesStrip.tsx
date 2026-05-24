import { SOURCES, type Source } from "../data/mockBrainData";

const STATUS_COLOR: Record<Source["status"], string> = {
  synced: "#7A8C5F",
  syncing: "#C28840",
  error: "#9E3B2E",
  not_connected: "#A89C8A"
};

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SourceLogo({ id }: { id: string }) {
  // Tasteful, monogram-style logo (warm tone, no neon)
  const letter = id.slice(0, 1).toUpperCase();
  const colors: Record<string, string> = {
    github: "#1A1612",
    gdrive: "#5E7A8C",
    slack: "#8B7FD4",
    notion: "#3B3733",
    figma: "#B8543D",
    linear: "#5A5450",
    vscode: "#3B82C4",
    cursor: "#1A1612",
    antigravity: "#7A8C5F",
    gmail: "#9E3B2E",
    fireflies: "#C28840",
    manual: "#8A7E6F"
  };
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-[4px] font-mono text-[12px] text-white"
      style={{ background: colors[id] ?? "#5A5450" }}
    >
      {letter}
    </div>
  );
}

export function SourcesStrip() {
  return (
    <section className="py-8">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
        Connected Sources
      </div>
      <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2">
        {SOURCES.map((src) => {
          const isConnected = src.status !== "not_connected";
          const isSyncing = src.status === "syncing";
          return (
            <div
              key={src.id}
              className={`group relative flex w-[220px] flex-shrink-0 flex-col gap-2 rounded-[4px] border bg-white p-3 transition-all ${
                isConnected ? "border-[rgba(26,22,18,0.08)]" : "border-[rgba(26,22,18,0.08)] opacity-60"
              } ${isSyncing ? "brain-source-sync" : ""}`}
              style={{
                borderLeftColor: isConnected ? "#7A8C5F" : "rgba(26,22,18,0.08)",
                borderLeftWidth: isConnected ? "2px" : "1px"
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <SourceLogo id={src.id} />
                  <div>
                    <div className="text-[13px] font-medium text-[#1A1612]">{src.name}</div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8A7E6F]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[src.status] }} />
                      {src.status.replace("_", " ")}
                    </div>
                  </div>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-mono text-[14px] text-[#1A1612]">{src.itemsIndexed.toLocaleString()}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A89C8A]">items</div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-[#8A7E6F]">{timeAgo(src.lastSync)}</div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-1 rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-[#FAF8F5] py-1.5 text-[11px] text-[#1A1612] hover:bg-white"
                >
                  + Connect
                </button>
              )}
              {isConnected ? (
                <div className="invisible absolute right-3 top-3 flex gap-1 group-hover:visible">
                  <button className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5450] hover:bg-[#FAF8F5]">
                    Configure
                  </button>
                  <button className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5450] hover:bg-[#FAF8F5]">
                    Resync
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes brain-breathe {
          0%, 100% { background-color: #FFFFFF; }
          50% { background-color: rgba(194,136,64,0.06); }
        }
        .brain-source-sync {
          animation: brain-breathe 2.6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
