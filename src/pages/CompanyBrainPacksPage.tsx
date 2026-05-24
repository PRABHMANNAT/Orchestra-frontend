import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  TbArrowDown,
  TbArrowUp,
  TbBolt,
  TbBoxMultiple,
  TbChevronRight,
  TbEye,
  TbPlayerPauseFilled,
  TbPlayerPlayFilled,
  TbPlus,
  TbRobot,
  TbSparkles,
  TbX
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import { DocMiniRef } from "../features/company-brain/components/BrainBits";
import {
  CONTEXT_PACKS,
  DOCS,
  HAIR,
  INK,
  MUTED,
  PURPLE,
  RUST,
  SUGGESTED_PACKS,
  TEAL,
  docById
} from "../features/company-brain/data";
import type { ContextPack } from "../features/company-brain/types";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CompanyBrainPacksPage() {
  const [packs, setPacks] = useState<ContextPack[]>(CONTEXT_PACKS);
  const [selectedId, setSelectedId] = useState<string>(CONTEXT_PACKS[0].id);
  const [creating, setCreating] = useState(false);

  const selected = packs.find((p) => p.id === selectedId) ?? packs[0];

  const togglePack = (id: string) =>
    setPacks((s) =>
      s.map((p) => (p.id === id ? { ...p, status: p.status === "active" ? "paused" : "active" } : p))
    );

  return (
    <BrainShell
      topBar={
        <BrainTopBar
          breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Context packs" }]}
          title="Context packs"
          actions={
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-sans text-[12px] text-white"
              style={{ background: RUST }}
            >
              <TbPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
              new pack
            </button>
          }
        />
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* list */}
        <aside className="h-full overflow-y-auto border-r" style={{ borderColor: HAIR }}>
          <div className="p-4">
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
              YOUR PACKS · {packs.length}
            </p>
            <ul className="space-y-1.5">
              {packs.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="block w-full rounded-[8px] border p-3 text-left transition-colors hover:bg-[#FAF8F5]"
                    style={{
                      borderColor: selectedId === p.id ? `${RUST}55` : HAIR,
                      background: selectedId === p.id ? `${RUST}06` : "white"
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-sans text-[13px]" style={{ color: INK }}>
                        {p.name}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          background: p.status === "active" ? `${TEAL}14` : "#F1ECE4",
                          color: p.status === "active" ? TEAL : MUTED
                        }}
                      >
                        {p.status === "active" ? <TbPlayerPlayFilled className="h-2.5 w-2.5" /> : <TbPlayerPauseFilled className="h-2.5 w-2.5" />}
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 font-sans text-[12px] leading-5" style={{ color: MUTED }}>
                      {p.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 font-mono text-[10px]" style={{ color: MUTED }}>
                      <span>{p.docIds.length} docs</span>
                      <span>· {p.usedByAgents} agents</span>
                      <span>· {p.loadsThisWeek} loads</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: PURPLE }}>
              SUGGESTED PACKS
            </p>
            <ul className="space-y-2">
              {SUGGESTED_PACKS.map((sp) => (
                <li key={sp.id} className="rounded-[8px] border p-3" style={{ borderColor: HAIR, background: `${PURPLE}06` }}>
                  <div className="flex items-center gap-1.5">
                    <TbSparkles className="h-3 w-3" strokeWidth={1.5} style={{ color: PURPLE }} />
                    <p className="font-sans text-[13px]" style={{ color: INK }}>
                      {sp.suggestedName}
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
                    {sp.reason}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sp.docIds.slice(0, 3).map((id) => (
                      <li key={id}>
                        <DocMiniRef docId={id} />
                      </li>
                    ))}
                    {sp.docIds.length > 3 ? (
                      <li className="font-mono text-[10px]" style={{ color: MUTED }}>
                        + {sp.docIds.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-sans text-[11px] text-white"
                    style={{ background: PURPLE }}
                  >
                    <TbPlus className="h-3 w-3" strokeWidth={1.5} />
                    create pack
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* detail */}
        <section className="h-full overflow-y-auto p-6">
          <PackDetail pack={selected} onToggle={() => togglePack(selected.id)} />
        </section>
      </div>

      <AnimatePresence>
        {creating ? <CreatePackModal onClose={() => setCreating(false)} /> : null}
      </AnimatePresence>
    </BrainShell>
  );
}

function PackDetail({ pack, onToggle }: { pack: ContextPack; onToggle: () => void }) {
  const [order, setOrder] = useState(pack.docIds);

  const move = (idx: number, dir: -1 | 1) => {
    const next = order.slice();
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrder(next);
  };

  return (
    <div className="mx-auto max-w-[800px]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
            PACK
          </p>
          <h1 className="mt-1 font-sans text-[22px]" style={{ color: INK }}>
            {pack.name}
          </h1>
          <p className="mt-1 max-w-[640px] font-sans text-[13px]" style={{ color: MUTED }}>
            {pack.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            {pack.status === "active" ? (
              <>
                <TbPlayerPauseFilled className="h-3 w-3" /> pause
              </>
            ) : (
              <>
                <TbPlayerPlayFilled className="h-3 w-3" /> activate
              </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <TbEye className="h-3 w-3" strokeWidth={1.5} />
            preview agent view
          </button>
        </div>
      </header>

      {/* triggers */}
      <section className="mb-4 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          TRIGGERS
        </p>
        <div className="flex flex-wrap gap-1.5">
          {pack.triggers.map((t) => (
            <span
              key={t}
              className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
              style={{ borderColor: HAIR, color: INK }}
            >
              <TbBolt className="mr-1 inline h-3 w-3" strokeWidth={1.5} style={{ color: PURPLE }} />
              {t}
            </span>
          ))}
          <button
            type="button"
            className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
            style={{ borderColor: HAIR, color: MUTED }}
          >
            + add trigger
          </button>
        </div>
      </section>

      {/* docs in order */}
      <section className="mb-4 rounded-[8px] border bg-white" style={{ borderColor: HAIR }}>
        <header className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: HAIR }}>
          <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
            DOCS (PRIORITY ORDER)
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 font-sans text-[11px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <TbPlus className="h-3 w-3" strokeWidth={1.5} />
            add doc
          </button>
        </header>
        <ul>
          {order.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${HAIR}` }}
            >
              <span className="w-6 font-mono text-[10px]" style={{ color: MUTED }}>
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <DocMiniRef docId={id} />
              </div>
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded-[4px] p-1 hover:bg-[#FAF8F5]"
                aria-label="move up"
                style={{ color: MUTED }}
              >
                <TbArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded-[4px] p-1 hover:bg-[#FAF8F5]"
                aria-label="move down"
                style={{ color: MUTED }}
              >
                <TbArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* usage stats */}
      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="loads this week" value={pack.loadsThisWeek} accent={TEAL} />
        <StatCard label="agents using" value={pack.usedByAgents} accent={PURPLE} />
        <StatCard label="success rate" value={`${pack.successRate}%`} accent={TEAL} sub="thumbs-up / total feedback" />
      </section>

      <section className="mt-4 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          WHAT THE AGENT SEES
        </p>
        <div className="rounded-[6px] border p-3 font-mono text-[11px] leading-5" style={{ borderColor: HAIR, background: "#FBF7F1", color: INK }}>
          {`# Context pack: ${pack.name}\n${pack.description}\n\n## Loaded documents`}
          <ul className="mt-2 space-y-1">
            {order.map((id, i) => {
              const d = docById(id);
              if (!d) return null;
              return (
                <li key={id}>
                  <span style={{ color: MUTED }}>{i + 1}. </span>
                  {d.title}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, sub }: { label: string; value: number | string; accent: string; sub?: string }) {
  return (
    <div className="rounded-[8px] border bg-white p-3" style={{ borderColor: HAIR }}>
      <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        {label.toUpperCase()}
      </p>
      <p className="mt-1 font-sans text-[22px] leading-none" style={{ color: accent }}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function CreatePackModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [docQuery, setDocQuery] = useState("");

  const filteredDocs = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    if (!q) return DOCS.slice(0, 8);
    return DOCS.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 12);
  }, [docQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-8"
      style={{ background: "rgba(26,22,18,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] rounded-[10px] border bg-white"
        style={{ borderColor: HAIR }}
      >
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: HAIR }}>
          <p className="font-sans text-[16px]" style={{ color: INK }}>
            New context pack
          </p>
          <button type="button" onClick={onClose} className="rounded-[6px] p-1.5 hover:bg-[#FAF8F5]" style={{ color: MUTED }}>
            <TbX className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>
        <div className="space-y-3 px-5 py-4">
          <Field label="name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payments context"
              className="w-full rounded-[6px] border px-2 py-1.5 font-sans text-[13px]"
              style={{ borderColor: HAIR, color: INK }}
            />
          </Field>
          <Field label="description">
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="what an agent should know about when to use this pack"
              className="w-full rounded-[6px] border px-2 py-1.5 font-sans text-[13px]"
              style={{ borderColor: HAIR, color: INK }}
            />
          </Field>
          <Field label="trigger conditions">
            <div className="flex flex-wrap gap-1.5">
              {triggers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]"
                  style={{ borderColor: HAIR, color: INK }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTriggers((s) => s.filter((x) => x !== t))}
                    style={{ color: MUTED }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && triggerInput.trim()) {
                    setTriggers((s) => [...s, triggerInput.trim()]);
                    setTriggerInput("");
                  }
                }}
                placeholder="file glob, project, task type…"
                className="flex-1 min-w-[200px] rounded-full border px-2 py-0.5 font-mono text-[11px] outline-none"
                style={{ borderColor: HAIR, color: INK }}
              />
            </div>
          </Field>
          <Field label="documents">
            <input
              value={docQuery}
              onChange={(e) => setDocQuery(e.target.value)}
              placeholder="search docs to add…"
              className="w-full rounded-[6px] border px-2 py-1.5 font-mono text-[12px]"
              style={{ borderColor: HAIR, color: INK }}
            />
            <ul className="mt-2 max-h-[180px] overflow-y-auto rounded-[6px] border" style={{ borderColor: HAIR }}>
              {filteredDocs.map((d) => {
                const on = selectedDocs.includes(d.id);
                return (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-[#FAF8F5]">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setSelectedDocs((s) => (on ? s.filter((x) => x !== d.id) : [...s, d.id]))}
                        className="accent-[color:#B8543D]"
                      />
                      <DocMiniRef docId={d.id} />
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
              {selectedDocs.length} selected
            </p>
          </Field>
        </div>
        <footer className="flex items-center justify-end gap-2 border-t px-5 py-3" style={{ borderColor: HAIR }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] border px-3 py-1.5 font-sans text-[12px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            cancel
          </button>
          <button
            type="button"
            disabled={!name.trim() || selectedDocs.length === 0}
            onClick={onClose}
            className="rounded-[6px] px-4 py-1.5 font-sans text-[12px] text-white disabled:opacity-40"
            style={{ background: RUST }}
          >
            create pack
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        {label.toUpperCase()}
      </p>
      {children}
    </div>
  );
}
