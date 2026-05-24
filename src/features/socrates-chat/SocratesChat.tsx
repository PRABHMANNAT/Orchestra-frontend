import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Artifact } from "./Artifacts";
import {
  FALLBACK_REPLY,
  SUGGESTIONS,
  findTemplate,
  type ArtifactKind,
  type ArtifactSpec,
  type Message
} from "./data";

function nowIso() {
  return new Date().toISOString();
}

const SEED_MESSAGES: Message[] = [
  {
    id: "seed-1",
    role: "user",
    text: "Show me the team's week",
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString()
  },
  {
    id: "seed-2",
    role: "assistant",
    text: "Here's the engineering team's week. I've highlighted the three commitments that don't have an owner yet — those are the most likely to slip. Hover any block for the room and attendees.",
    artifact: { id: "art-cal", kind: "calendar", title: "Engineering · week of May 25", subtitle: "23 events · 3 unassigned" },
    timestamp: new Date(Date.now() - 1000 * 60 * 11 + 4000).toISOString(),
    citations: [
      { label: "Google Calendar", source: "calendar" },
      { label: "Linear epic E-42", source: "linear" }
    ]
  }
];

export function SocratesChat() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactSpec | null>(
    SEED_MESSAGES.find((m) => m.artifact)?.artifact ?? null
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: crypto.randomUUID?.() ?? `u-${Date.now()}`, role: "user", text: trimmed, timestamp: nowIso() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const tmpl = findTemplate(trimmed);
      const reply: Message = tmpl
        ? {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: tmpl.reply,
            artifact: tmpl.artifact,
            citations: tmpl.citations,
            timestamp: nowIso()
          }
        : {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: FALLBACK_REPLY,
            timestamp: nowIso()
          };
      setMessages((m) => [...m, reply]);
      setThinking(false);
      if (reply.artifact) {
        setActiveArtifact(reply.artifact);
        setPanelOpen(true);
      }
    }, 1200);
  }

  function openArtifact(a: ArtifactSpec) {
    setActiveArtifact(a);
    setPanelOpen(true);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F1EB] text-[#1A1612]">
      {/* LEFT — chat column */}
      <section
        className="flex min-w-0 flex-col transition-all duration-300 ease-out"
        style={{ width: panelOpen ? (panelExpanded ? "40%" : "55%") : "100%" }}
      >
        <Header
          onNewChat={() => {
            setMessages([]);
            setActiveArtifact(null);
          }}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
          activeArtifact={activeArtifact}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 xl:px-16">
          <div className="mx-auto max-w-[760px]">
            {messages.length === 0 ? (
              <EmptyState onPick={(s) => send(s)} />
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} onOpenArtifact={openArtifact} />
                ))}
                {thinking ? <Thinking /> : null}
              </div>
            )}
          </div>
        </div>

        <Composer
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={() => send(input)}
          disabled={thinking}
        />
      </section>

      {/* RIGHT — artifact panel */}
      <AnimatePresence initial={false}>
        {panelOpen ? (
          <motion.aside
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelExpanded ? "60%" : "45%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            className="flex h-full flex-col overflow-hidden border-l border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]"
          >
            <ArtifactHeader
              spec={activeArtifact}
              expanded={panelExpanded}
              onToggleExpand={() => setPanelExpanded((v) => !v)}
              onClose={() => setPanelOpen(false)}
            />
            <div className="relative flex-1 overflow-hidden p-5">
              <AnimatePresence mode="wait">
                {activeArtifact ? (
                  <motion.div
                    key={activeArtifact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full"
                  >
                    <Artifact kind={activeArtifact.kind} />
                  </motion.div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#A89C8A]">No artifact</div>
                      <div className="mt-2 max-w-[280px] text-[13px] text-[#8A7E6F]">
                        Ask Socrates a question. When the answer is better seen than read, an artifact appears here.
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            <ArtifactFooter spec={activeArtifact} />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ============ Header ============ */

function Header({
  onNewChat,
  panelOpen,
  onTogglePanel,
  activeArtifact
}: {
  onNewChat: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  activeArtifact: ArtifactSpec | null;
}) {
  return (
    <header className="flex h-[64px] items-center justify-between gap-4 border-b border-[rgba(26,22,18,0.08)] bg-[#F5F1EB] px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1612]">
          <span className="font-serif text-[14px] text-white">Σ</span>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A7E6F]">Orchestra</div>
          <div className="font-serif text-[16px] leading-none text-[#1A1612]">Socrates</div>
        </div>
      </div>
      <div className="hidden flex-1 items-center justify-center md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">
          {activeArtifact ? `viewing · ${activeArtifact.title}` : "thinking partner · grounded in the brain"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          className="rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5A5450] hover:bg-[#FAF8F5]"
        >
          + New
        </button>
        <button
          onClick={onTogglePanel}
          className={`rounded-[4px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            panelOpen
              ? "border-[#1A1612] bg-[#1A1612] text-white hover:bg-[#3B3733]"
              : "border-[rgba(26,22,18,0.12)] bg-white text-[#5A5450] hover:bg-[#FAF8F5]"
          }`}
        >
          {panelOpen ? "Hide canvas ›" : "‹ Show canvas"}
        </button>
      </div>
    </header>
  );
}

/* ============ Empty state ============ */

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A7E6F]">Ask anything</div>
      <h1 className="mt-3 max-w-[560px] font-serif text-[40px] leading-[1.08] tracking-[-0.012em] text-[#1A1612] sm:text-[52px]">
        What can I help you think through?
      </h1>
      <p className="mt-4 max-w-[460px] text-[14px] leading-[1.6] text-[#5A5450]">
        Socrates is grounded in your brain. Answers come with citations and, when useful, an interactive artifact on the right.
      </p>
      <div className="mt-10 grid w-full max-w-[640px] grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onPick(s.text)}
            className="group flex items-center justify-between gap-3 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white px-4 py-3 text-left transition-all hover:-translate-y-px hover:border-[rgba(26,22,18,0.18)] hover:shadow-[0_4px_12px_rgba(26,22,18,0.06)]"
          >
            <span className="text-[13px] text-[#1A1612]">{s.text}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#A89C8A] group-hover:text-[#5A5450]">
              {s.kind}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ Message bubble ============ */

function MessageBubble({ message, onOpenArtifact }: { message: Message; onOpenArtifact: (a: ArtifactSpec) => void }) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-[6px] rounded-tr-[2px] bg-[#1A1612] px-4 py-2.5 text-[14px] leading-[1.55] text-[#FAF8F5]">
          {message.text}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3"
    >
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] text-[14px] text-[#1A1612] ring-1 ring-[rgba(26,22,18,0.12)]">
        <span className="font-serif">Σ</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] leading-[1.7] text-[#1A1612]">{message.text}</div>
        {message.citations && message.citations.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-[3px] bg-[rgba(26,22,18,0.05)] px-2 py-0.5 font-mono text-[10px] text-[#5A5450]">
                <span className="text-[#A89C8A]">{i + 1}</span>
                <span>{c.label}</span>
                <span className="text-[#A89C8A]">· {c.source}</span>
              </span>
            ))}
          </div>
        ) : null}
        {message.artifact ? (
          <button
            onClick={() => onOpenArtifact(message.artifact!)}
            className="mt-3 inline-flex items-center gap-2 rounded-[3px] border border-[rgba(184,84,61,0.4)] bg-[rgba(184,84,61,0.06)] px-3 py-1.5 text-[12px] text-[#B8543D] transition-colors hover:bg-[rgba(184,84,61,0.12)]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">artifact</span>
            <span className="font-medium">{message.artifact.title}</span>
            <span>›</span>
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5] text-[14px] text-[#1A1612] ring-1 ring-[rgba(26,22,18,0.12)]">
        <span className="font-serif">Σ</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#5A5450]"
            style={{
              animation: `socratesPulse 1.2s ease-in-out ${i * 0.18}s infinite`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes socratesPulse {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}

/* ============ Composer ============ */

import { forwardRef, type KeyboardEvent } from "react";

const Composer = forwardRef<HTMLTextAreaElement, {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}>(function Composer({ value, onChange, onSubmit, disabled }, ref) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }
  return (
    <div className="border-t border-[rgba(26,22,18,0.08)] bg-[#F5F1EB] px-6 py-4 lg:px-10 lg:py-5">
      <div className="mx-auto max-w-[760px]">
        <div className="flex items-end gap-2 rounded-[6px] border border-[rgba(26,22,18,0.12)] bg-white p-2 focus-within:border-[rgba(184,84,61,0.5)]">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message Socrates · grounded in the brain"
            rows={1}
            disabled={disabled}
            className="max-h-[200px] min-h-[34px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-[1.5] text-[#1A1612] placeholder:text-[#A89C8A] focus:outline-none disabled:opacity-50"
            style={{ height: Math.min(200, Math.max(34, 24 * (value.split("\n").length + Math.floor(value.length / 60)))) }}
          />
          <button
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-[#1A1612] text-white transition-colors hover:bg-[#3B3733] disabled:cursor-not-allowed disabled:bg-[rgba(26,22,18,0.18)]"
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="4" />
              <polyline points="5 11 12 4 19 11" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-[#A89C8A]">
          <span>⏎ to send · ⇧⏎ for newline</span>
          <span>citations · {disabled ? "drafting…" : "ready"}</span>
        </div>
      </div>
    </div>
  );
});

/* ============ Artifact header + footer ============ */

function ArtifactHeader({
  spec,
  expanded,
  onToggleExpand,
  onClose
}: {
  spec: ArtifactSpec | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-[64px] flex-shrink-0 items-center justify-between gap-3 border-b border-[rgba(26,22,18,0.08)] px-5">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
          {spec ? `Artifact · ${kindLabel(spec.kind)}` : "Canvas"}
        </div>
        <div className="truncate font-serif text-[16px] leading-tight text-[#1A1612]">
          {spec?.title ?? "Nothing here yet"}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton label="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </IconButton>
        <IconButton label="Share">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
            <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
          </svg>
        </IconButton>
        <IconButton label={expanded ? "Collapse" : "Expand"} onClick={onToggleExpand}>
          {expanded ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </IconButton>
        <IconButton label="Close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}

function ArtifactFooter({ spec }: { spec: ArtifactSpec | null }) {
  if (!spec) return null;
  return (
    <div className="flex h-[44px] flex-shrink-0 items-center justify-between border-t border-[rgba(26,22,18,0.08)] bg-[#F5F1EB] px-5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">{spec.subtitle ?? kindLabel(spec.kind)}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A89C8A]">
        generated · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  );
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-transparent text-[#5A5450] transition-colors hover:border-[rgba(26,22,18,0.12)] hover:bg-white"
    >
      {children}
    </button>
  );
}

function kindLabel(k: ArtifactKind): string {
  return {
    calendar: "Calendar",
    metrics: "Metrics",
    arch: "Architecture",
    org: "Org chart",
    decisions: "Decision timeline",
    compare: "Comparison",
    code: "Code",
    doc: "Document",
    graph: "Dependency graph"
  }[k];
}
