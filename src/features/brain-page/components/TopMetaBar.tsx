import { useEffect, useState } from "react";

type TopMetaBarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  onFocusSearch: () => void;
  onOpenCapture: () => void;
};

export function TopMetaBar({ query, onQueryChange, onFocusSearch, onOpenCapture }: TopMetaBarProps) {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onFocusSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFocusSearch]);

  return (
    <div className="flex h-[64px] items-center gap-4 border-b border-[rgba(26,22,18,0.08)] bg-[#F5F1EB] px-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#8A7E6F]">
        <span>Northstar Cloud</span>
        <span className="text-[#A89C8A]">/</span>
        <span className="text-[#1A1612]">Brain</span>
      </div>
      <div className="mx-auto w-full max-w-[640px]">
        <div
          className={`flex items-center gap-2 rounded-[4px] border bg-white px-3 py-2 transition-colors ${
            focused ? "border-[rgba(184,84,61,0.4)]" : "border-[rgba(26,22,18,0.12)]"
          }`}
        >
          <SearchIcon />
          <input
            id="brain-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask the brain anything..."
            className="flex-1 bg-transparent text-[14px] text-[#1A1612] placeholder:text-[#A89C8A] focus:outline-none"
          />
          <kbd className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-[#FAF8F5] px-1.5 py-0.5 font-mono text-[10px] text-[#8A7E6F]">
            ⌘K
          </kbd>
          <button
            type="button"
            className="text-[#8A7E6F] hover:text-[#1A1612]"
            aria-label="Filter"
          >
            <FilterIcon />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCapture}
          className="flex h-9 items-center gap-1.5 rounded-[4px] bg-[#B8543D] px-3 text-[13px] text-white hover:bg-[#A04830]"
        >
          <PlusIcon />
          Capture
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white text-[#5A5450] hover:bg-[#FAF8F5]"
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B8543D] font-mono text-[12px] text-white">
          AD
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7E6F" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.5" y2="16.5" />
    </svg>
  );
}
function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
