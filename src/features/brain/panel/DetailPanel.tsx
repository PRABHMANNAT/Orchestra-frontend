import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TbArrowUpRight, TbBookmark, TbFileText, TbSend, TbX } from "react-icons/tb";
import type { BrainData, BrainNode } from "../brain.types";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useBrainStore } from "../state/brainStore";
import { brainTokens } from "../tokens";

const SUGGESTIONS = ["Summarize this", "What decisions does this affect?", "Who should review this?"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function categoryLabel(category: BrainNode["category"]) {
  if (category === "doc") return "Document";
  if (category === "comms") return "Comms";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function DetailTab({ node, data }: { node: BrainNode; data: BrainData }) {
  const [expanded, setExpanded] = useState(false);
  const save = useBrainStore((state) => state.saveSelectedNode);
  const savedNodeIds = useBrainStore((state) => state.savedNodeIds);
  const selectNode = useBrainStore((state) => state.selectNode);
  const color = brainTokens.pin[node.category];
  const isSaved = savedNodeIds.includes(node.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="flex h-[180px] items-center justify-center border-b border-[rgba(26,22,18,0.08)]" style={{ background: brainTokens.categoryTint[node.category] }}>
          {node.thumbnail ? <img src={node.thumbnail} alt="" className="h-full w-full object-cover" /> : <TbFileText size={32} style={{ color, opacity: 0.3 }} strokeWidth={1.5} />}
        </div>

        <dl className="mx-6 mt-5 grid grid-cols-3 divide-x divide-[rgba(26,22,18,0.06)] border-y border-[rgba(26,22,18,0.06)] py-4">
          {[
            ["Source", node.source ?? "None"],
            ["Updated", formatDate(node.updatedAt)],
            ["Author", node.author ?? "Unknown"]
          ].map(([label, value]) => (
            <div key={label} className="px-3 first:pl-0">
              <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#78716C]">{label}</dt>
              <dd className="mt-1 truncate font-mono text-[13px] text-[#1A1612]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="relative mx-6 mt-6">
          <p className={`font-sans text-[16px] leading-[1.6] text-[#1A1612] ${expanded ? "" : "line-clamp-4"}`}>{node.description}</p>
          {!expanded ? (
            <div className="absolute inset-x-0 bottom-0 flex h-12 items-end bg-gradient-to-t from-[#FAF8F5] to-transparent">
              <button type="button" onClick={() => setExpanded(true)} className="font-sans text-[13px] font-medium text-[#B8543D]">
                Read more
              </button>
            </div>
          ) : null}
        </div>

        {node.connections?.length ? (
          <div className="mx-6 mt-6">
            <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#78716C]">Connected to</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {node.connections.map((id) => {
                const target = data.nodes.find((candidate) => candidate.id === id);
                const chipColor = target ? brainTokens.pin[target.category] : color;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => target && selectNode(target)}
                    className="whitespace-nowrap rounded-full px-3 py-2 font-sans text-[13px] font-medium"
                    style={{ background: target ? brainTokens.categoryTint[target.category] : brainTokens.categoryTint[node.category], color: chipColor }}
                  >
                    {target?.title ?? id}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <footer className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-t border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-6">
        <button type="button" onClick={save} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#B8543D] px-4 font-sans text-[14px] font-medium text-white transition-colors hover:bg-[#A04830]">
          <TbBookmark size={15} strokeWidth={1.7} />
          {isSaved ? "Saved" : "Save to project"}
        </button>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-1.5 font-sans text-[14px] font-medium text-[#B8543D]">
          Open in full
          <TbArrowUpRight size={15} strokeWidth={1.7} />
        </button>
      </footer>
    </div>
  );
}

function SocratesTab({ node, data }: { node: BrainNode; data: BrainData }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messages = useBrainStore((state) => state.chatHistory);
  const addMessage = useBrainStore((state) => state.addMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage = { role: "user" as const, content, timestamp: new Date().toISOString() };
    setInput("");
    setLoading(true);
    addMessage(userMessage);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Socrates, the assistant for ${data.projectName}. The user is asking about a specific document called "${node.title}". Here is the document content: ${node.description}. Answer concisely in plain prose. No markdown. No bullet points unless asked.`,
          messages: [...messages, userMessage].map((message) => ({ role: message.role, content: message.content }))
        })
      });
      const payload = await response.json();
      const reply = payload.content?.find((block: { type?: string; text?: string }) => block.type === "text")?.text ?? "I could not get a response for this document.";
      addMessage({ role: "assistant", content: reply, timestamp: new Date().toISOString() });
    } catch {
      addMessage({ role: "assistant", content: "I could not reach Socrates from this environment. Try again once the API proxy is available.", timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[rgba(26,22,18,0.04)] px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[#78716C]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B8543D]" />
          Asking about: {node.title}
        </div>

        {!messages.length ? (
          <div className="mb-4 flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => send(suggestion)} className="rounded-lg border border-[rgba(26,22,18,0.12)] px-3.5 py-2 text-left font-sans text-[13px] text-[#1A1612] transition-colors hover:border-[#B8543D] hover:text-[#B8543D]">
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div key={`${message.timestamp}-${index}`} className={`flex max-w-[85%] flex-col ${message.role === "user" ? "self-end items-end" : "self-start"}`}>
              <p className={`m-0 rounded-xl px-3.5 py-2.5 font-sans text-[14px] leading-[1.55] text-[#1A1612] ${message.role === "user" ? "bg-[rgba(26,22,18,0.06)]" : "border border-[rgba(26,22,18,0.08)] bg-white"}`}>
                {message.content}
              </p>
              <span className="mt-1 font-mono text-[10px] text-[#78716C]">{timeLabel(message.timestamp)}</span>
            </div>
          ))}
          {loading ? <div className="self-start rounded-xl border border-[rgba(26,22,18,0.08)] bg-white px-3.5 py-2.5 font-sans text-[14px] text-[#78716C]">Thinking...</div> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex h-14 flex-shrink-0 items-center gap-3 border-t border-[rgba(26,22,18,0.08)] px-6">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void send(input);
            }
          }}
          placeholder="Ask about this document..."
          className="min-w-0 flex-1 bg-transparent font-sans text-[14px] text-[#1A1612] outline-none placeholder:text-[#78716C]/60"
        />
        <button type="button" onClick={() => void send(input)} disabled={loading || !input.trim()} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8543D] text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send Socrates message">
          <TbSend size={15} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}

export function DetailPanel({ data }: { data: BrainData }) {
  const node = useBrainStore((state) => state.selectedNode);
  const activeTab = useBrainStore((state) => state.activeTab);
  const setTab = useBrainStore((state) => state.setTab);
  const close = useBrainStore((state) => state.clearSelection);
  const reducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (node) closeButtonRef.current?.focus();
  }, [node]);

  return (
    <AnimatePresence>
      {node ? (
        <motion.aside
          initial={reducedMotion ? { opacity: 0 } : { x: 440, opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { x: 440, opacity: 0 }}
          transition={reducedMotion ? { duration: 0.2, ease: "easeOut" } : { type: "spring", damping: 28, stiffness: 240 }}
          className="relative flex h-full w-[440px] flex-shrink-0 flex-col overflow-hidden border-l border-[#B8543D] bg-[#FAF8F5] text-[#1A1612]"
          aria-label={`${node.title} details`}
        >
          <header className="flex flex-shrink-0 flex-col border-b border-[rgba(26,22,18,0.08)] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: brainTokens.pin[node.category] }} />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#78716C]">{categoryLabel(node.category)}</span>
              </div>
              <button ref={closeButtonRef} type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full text-[#78716C] transition-colors hover:text-[#1A1612]" aria-label="Close detail panel">
                <TbX size={20} strokeWidth={1.6} />
              </button>
            </div>
            <h2 className="mt-4 font-sans text-[24px] font-medium leading-[1.25] tracking-[-0.015em]">{node.title}</h2>
          </header>

          <div className="flex h-10 flex-shrink-0 items-end gap-6 border-b border-[rgba(26,22,18,0.06)] px-6">
            {[
              ["detail", "Document"],
              ["socrates", "Ask Socrates"]
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab as "detail" | "socrates")}
                className={`h-10 border-b-2 px-0 font-sans text-[13px] font-medium transition-colors ${activeTab === tab ? "border-[#B8543D] text-[#1A1612]" : "border-transparent text-[#78716C]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {activeTab === "detail" ? <DetailTab node={node} data={data} /> : <SocratesTab node={node} data={data} />}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
