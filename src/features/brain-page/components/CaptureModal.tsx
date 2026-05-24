import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { chatJSON, hasOpenAIKey } from "../../../lib/openaiClient";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STAGES = ["ingesting", "parsing", "embedding", "linking", "ready"] as const;
type Stage = (typeof STAGES)[number];

type AutoMeta = {
  title: string;
  summary: string;
  tags: string;
  project: string;
  owner: string;
};

const EXTRACT_SYSTEM = `You are extracting metadata for a memory being added to Northstar Cloud's company brain. Read the user-provided text and return JSON with: title (short, factual), summary (1-2 sentences), tags (comma-separated, 3-5 tags), project (best-guess project name from "Northstar Cloud" / "Payments v2" / "Onboarding Redesign" / "Customer Acme" / "Apollo Expansion" or empty), owner (best-guess owner name from the text, or empty).`;

const DEFAULT_META: AutoMeta = {
  title: "Pricing call recap — Acme",
  summary: "Acme's pricing committee is leaning toward yearly. Procurement asked for a SOC2 letter by Friday.",
  tags: "pricing, acme, enterprise",
  project: "Customer Acme",
  owner: "Marcus Thompson"
};

export function CaptureModal({ open, onClose }: Props) {
  const [stage, setStage] = useState<Stage | null>(null);
  const [rawText, setRawText] = useState("");
  const [meta, setMeta] = useState<AutoMeta & { access: string; agent: boolean; expires: string; sourceOfTruth: boolean }>({
    ...DEFAULT_META,
    access: "Team",
    agent: true,
    expires: "2027-05-24",
    sourceOfTruth: false
  });

  useEffect(() => {
    if (!open) {
      setStage(null);
    }
  }, [open]);

  useEffect(() => {
    if (stage === null) return;
    const idx = STAGES.indexOf(stage);
    if (idx === STAGES.length - 1) return;
    const t = setTimeout(() => setStage(STAGES[idx + 1]), 700);
    return () => clearTimeout(t);
  }, [stage]);

  // When we reach the "parsing" stage and we have pasted text, ask the model
  // to extract metadata.
  useEffect(() => {
    if (stage !== "parsing" || !rawText.trim() || !hasOpenAIKey()) return;
    let cancelled = false;
    (async () => {
      const result = await chatJSON<AutoMeta>(EXTRACT_SYSTEM, rawText.slice(0, 4000), {
        temperature: 0.2
      });
      if (cancelled || !result) return;
      setMeta((prev) => ({
        ...prev,
        title: result.title || prev.title,
        summary: result.summary || prev.summary,
        tags: result.tags || prev.tags,
        project: result.project || prev.project,
        owner: result.owner || prev.owner
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, rawText]);

  function beginIngest(seed?: string) {
    if (seed) setRawText(seed);
    setStage("ingesting");
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,18,0.32)] p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="w-full max-w-[640px] overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] shadow-[0_24px_64px_rgba(26,22,18,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[rgba(26,22,18,0.08)] p-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Capture</div>
                <h2 className="mt-1 font-serif text-[24px] text-[#1A1612]">Add to the brain</h2>
              </div>
              <button onClick={onClose} className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white p-1.5 text-[#5A5450]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              <button
                onClick={() => beginIngest()}
                className="flex flex-col items-center justify-center gap-2 rounded-[4px] border border-dashed border-[rgba(26,22,18,0.2)] bg-white p-5 text-[13px] text-[#5A5450] hover:border-[#B8543D] hover:text-[#1A1612]"
              >
                <span className="font-mono text-[20px]">↑</span>
                Drag and drop files
              </button>
              <div className="rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">Paste URL</div>
                <input
                  placeholder="https://..."
                  className="mt-1 w-full bg-transparent text-[13px] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) beginIngest(v);
                    }
                  }}
                />
              </div>
              <div className="col-span-2 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">Paste text</div>
                  {rawText.length > 0 ? (
                    <button
                      onClick={() => beginIngest()}
                      className="rounded-[3px] bg-[#1A1612] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white hover:bg-[#3B3733]"
                    >
                      Extract →
                    </button>
                  ) : null}
                </div>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={hasOpenAIKey() ? "Notes, transcript, decision summary… (AI will auto-extract metadata)" : "Notes, transcript, decision summary..."}
                  className="mt-1 w-full resize-none bg-transparent text-[13px] focus:outline-none"
                />
              </div>
              <button
                onClick={() => beginIngest()}
                className="col-span-2 flex items-center justify-center gap-2 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white py-3 text-[13px] text-[#5A5450] hover:bg-white"
              >
                <span className="text-[#B8543D]">●</span> Record voice note
              </button>
            </div>

            {stage ? (
              <div className="border-t border-[rgba(26,22,18,0.08)] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  {STAGES.map((s) => {
                    const idx = STAGES.indexOf(s);
                    const current = STAGES.indexOf(stage);
                    const done = idx < current;
                    const active = idx === current;
                    return (
                      <div key={s} className="flex flex-1 items-center gap-2">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            done ? "bg-[#7A8C5F]" : active ? "bg-[#C28840]" : "bg-[rgba(26,22,18,0.12)]"
                          }`}
                        />
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                            active ? "text-[#1A1612]" : "text-[#A89C8A]"
                          }`}
                        >
                          {s}
                        </span>
                        {idx < STAGES.length - 1 ? (
                          <span className="h-px flex-1 bg-[rgba(26,22,18,0.08)]" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 text-[12px]">
                  <Field label="Title">
                    <input
                      value={meta.title}
                      onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                      className="w-full bg-transparent text-[13px] text-[#1A1612] focus:outline-none"
                    />
                  </Field>
                  <Field label="Summary">
                    <textarea
                      rows={2}
                      value={meta.summary}
                      onChange={(e) => setMeta({ ...meta, summary: e.target.value })}
                      className="w-full resize-none bg-transparent text-[13px] text-[#1A1612] focus:outline-none"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Project">
                      <input
                        value={meta.project}
                        onChange={(e) => setMeta({ ...meta, project: e.target.value })}
                        className="w-full bg-transparent text-[13px] text-[#1A1612] focus:outline-none"
                      />
                    </Field>
                    <Field label="Owner">
                      <input
                        value={meta.owner}
                        onChange={(e) => setMeta({ ...meta, owner: e.target.value })}
                        className="w-full bg-transparent text-[13px] text-[#1A1612] focus:outline-none"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Access">
                      <span className="text-[13px] text-[#1A1612]">{meta.access}</span>
                    </Field>
                    <Field label="Agent">
                      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={meta.agent}
                          onChange={(e) => setMeta({ ...meta, agent: e.target.checked })}
                        />
                        Accessible
                      </label>
                    </Field>
                    <Field label="Expires">
                      <span className="font-mono text-[12px] text-[#1A1612]">{meta.expires}</span>
                    </Field>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 pt-1 text-[12px] text-[#5A5450]">
                    <input
                      type="checkbox"
                      checked={meta.sourceOfTruth}
                      onChange={(e) => setMeta({ ...meta, sourceOfTruth: e.target.checked })}
                    />
                    Mark as source of truth
                  </label>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="rounded-[4px] border border-[rgba(26,22,18,0.12)] bg-white px-3 py-1.5 text-[12px] text-[#5A5450] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClose}
                    disabled={stage !== "ready"}
                    className={`rounded-[4px] px-3 py-1.5 text-[12px] text-white ${
                      stage === "ready" ? "bg-[#B8543D] hover:bg-[#A04830]" : "bg-[rgba(26,22,18,0.2)]"
                    }`}
                  >
                    {stage === "ready" ? "Add to brain" : "Processing…"}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px] border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-2.5 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8A7E6F]">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
