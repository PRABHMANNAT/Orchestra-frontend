import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  TbCheck,
  TbFile,
  TbLink,
  TbMessage2,
  TbSparkles,
  TbUpload,
  TbX
} from "react-icons/tb";
import type { AccessLevel } from "../types";
import { HAIR, INK, MUTED, ORANGE, PURPLE, RUST, TEAL } from "../data";

type Stage = "uploading" | "parsing" | "extracting" | "embedding" | "done";
const STAGES: Stage[] = ["uploading", "parsing", "extracting", "embedding", "done"];
const STAGE_LABEL: Record<Stage, string> = {
  uploading: "uploading",
  parsing: "parsing content",
  extracting: "extracting entities",
  embedding: "embedding",
  done: "done"
};

interface UploadItem {
  id: string;
  name: string;
  size: string;
  kind: "file" | "url" | "text";
  stage: Stage;
  progress: number; // 0..100 within current stage
}

const ease = [0.22, 1, 0.36, 1] as const;

export function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved?: (id: string) => void }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showText, setShowText] = useState(false);

  // metadata (auto-filled after parse)
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [project, setProject] = useState("northstar");
  const [access, setAccess] = useState<AccessLevel>("public-team");
  const [truth, setTruth] = useState(false);
  const [truthTopic, setTruthTopic] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiry, setExpiry] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // simulate per-item progress
  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setItems((curr) =>
        curr.map((it) => {
          if (it.stage === "done") return it;
          const next = { ...it, progress: it.progress + 10 + Math.random() * 25 };
          if (next.progress >= 100) {
            const idx = STAGES.indexOf(it.stage);
            const nextStage = STAGES[Math.min(idx + 1, STAGES.length - 1)];
            return { ...next, stage: nextStage, progress: nextStage === "done" ? 100 : 0 };
          }
          return next;
        })
      );
    }, 380);
    return () => clearInterval(interval);
  }, [items.length]);

  const allDone = items.length > 0 && items.every((i) => i.stage === "done");

  // After first item reaches "embedding", auto-fill metadata
  useEffect(() => {
    if (items.length === 0) return;
    const first = items[0];
    if ((first.stage === "embedding" || first.stage === "done") && title === "") {
      setTitle(suggestTitle(first.name));
      setSummary(suggestSummary(first.name));
      setTags(suggestTags(first.name));
      setTruthTopic(suggestTopic(first.name));
    }
  }, [items, title]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    setItems((curr) => [
      ...curr,
      ...arr.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        name: f.name,
        size: humanSize(f.size),
        kind: "file" as const,
        stage: "uploading" as Stage,
        progress: 0
      }))
    ]);
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    setItems((curr) => [
      ...curr,
      {
        id: `url-${Date.now()}`,
        name: urlInput.trim(),
        size: "auto-fetch",
        kind: "url",
        stage: "uploading",
        progress: 0
      }
    ]);
    setUrlInput("");
  };

  const addText = () => {
    if (!textInput.trim()) return;
    setItems((curr) => [
      ...curr,
      {
        id: `text-${Date.now()}`,
        name: `paste-${new Date().toISOString().slice(11, 19)}.md`,
        size: `${textInput.length} chars`,
        kind: "text",
        stage: "parsing",
        progress: 0
      }
    ]);
    setTextInput("");
    setShowText(false);
  };

  const save = () => {
    const id = `d-new-${Date.now()}`;
    onSaved?.(id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
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
          role="dialog"
          aria-label="Upload to Company Brain"
        >
          <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: HAIR }}>
            <div>
              <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
                UPLOAD TO COMPANY BRAIN
              </p>
              <h2 className="mt-0.5 font-sans text-[16px]" style={{ color: INK }}>
                Add new knowledge
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[6px] p-1.5 hover:bg-[#FAF8F5]"
              style={{ color: MUTED }}
              aria-label="close"
            >
              <TbX className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </header>

          <div className="px-5 py-4">
            {items.length === 0 ? (
              <>
                {/* drop zone */}
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed px-6 py-10 text-center"
                  style={{
                    borderColor: dragOver ? RUST : "rgba(26,22,18,0.16)",
                    background: dragOver ? `${RUST}08` : "#FBF7F1"
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                  <TbUpload className="h-6 w-6" strokeWidth={1.5} style={{ color: MUTED }} />
                  <p className="mt-2 font-sans text-[14px]" style={{ color: INK }}>
                    Drop files here or{" "}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="underline"
                      style={{ color: RUST }}
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
                    pdf · docx · md · txt · images · audio · video · code · zip
                  </p>
                </label>

                {/* URL row */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[6px]" style={{ background: "#F1ECE4", color: MUTED }}>
                    <TbLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </span>
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="paste a URL — we'll auto-fetch the content"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addUrl();
                    }}
                    className="flex-1 rounded-[6px] border px-2.5 py-1.5 font-sans text-[13px] outline-none placeholder:text-[#A09790]"
                    style={{ borderColor: HAIR, color: INK }}
                  />
                  <button
                    type="button"
                    onClick={addUrl}
                    className="rounded-[6px] border px-3 py-1.5 font-sans text-[12px]"
                    style={{ borderColor: HAIR, color: INK }}
                  >
                    fetch
                  </button>
                </div>

                {/* paste as knowledge */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowText((s) => !s)}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 font-sans text-[12px]"
                    style={{ borderColor: HAIR, color: INK }}
                  >
                    <TbMessage2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    paste as knowledge
                  </button>
                  {showText ? (
                    <div className="mt-2">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={4}
                        placeholder="paste raw text — agents will index it as a doc"
                        className="w-full rounded-[6px] border p-2 font-mono text-[12px] outline-none placeholder:text-[#A09790]"
                        style={{ borderColor: HAIR, color: INK }}
                      />
                      <div className="mt-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={addText}
                          className="rounded-[6px] px-3 py-1 font-sans text-[12px] text-white"
                          style={{ background: RUST }}
                        >
                          add
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                {/* upload progress list */}
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it.id} className="rounded-[6px] border px-3 py-2" style={{ borderColor: HAIR }}>
                      <div className="flex items-center gap-2">
                        <TbFile className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: MUTED }} />
                        <span className="flex-1 truncate font-mono text-[12px]" style={{ color: INK }}>
                          {it.name}
                        </span>
                        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                          {it.size}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex flex-1 flex-wrap items-center gap-1.5 font-mono text-[10px]">
                          {STAGES.filter((s) => s !== "done").map((s) => {
                            const idx = STAGES.indexOf(s);
                            const curr = STAGES.indexOf(it.stage);
                            const done = curr > idx || it.stage === "done";
                            const active = it.stage === s;
                            return (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
                                style={{
                                  background: active ? `${PURPLE}14` : done ? `${TEAL}14` : "#F1ECE4",
                                  color: active ? PURPLE : done ? TEAL : MUTED
                                }}
                              >
                                {done ? <TbCheck className="h-2.5 w-2.5" strokeWidth={2} /> : null}
                                {STAGE_LABEL[s]}
                              </span>
                            );
                          })}
                          {it.stage === "done" ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
                              style={{ background: `${TEAL}14`, color: TEAL }}
                            >
                              <TbCheck className="h-2.5 w-2.5" strokeWidth={2} />
                              done
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {it.stage !== "done" ? (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: HAIR }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${it.progress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                            style={{
                              background: it.stage === "uploading" ? RUST : it.stage === "embedding" ? PURPLE : TEAL
                            }}
                          />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {/* metadata */}
                {allDone ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease }}
                    className="mt-4 rounded-[8px] border p-4"
                    style={{ borderColor: HAIR, background: "#FBF7F1" }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: `${PURPLE}14`, color: PURPLE }}
                      >
                        <TbSparkles className="h-3 w-3" strokeWidth={1.5} />
                      </span>
                      <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: PURPLE }}>
                        AUTO-DETECTED METADATA — REVIEW & EDIT
                      </p>
                    </div>

                    <Field label="Title">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-[6px] border bg-white px-2 py-1.5 font-sans text-[13px] outline-none"
                        style={{ borderColor: HAIR, color: INK }}
                      />
                    </Field>

                    <Field label="Auto-summary (3 lines)">
                      <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={3}
                        className="w-full rounded-[6px] border bg-white px-2 py-1.5 font-sans text-[12px] leading-5 outline-none"
                        style={{ borderColor: HAIR, color: INK }}
                      />
                    </Field>

                    <Field label="Suggested tags">
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-mono text-[11px]"
                            style={{ border: `1px solid ${HAIR}`, color: INK }}
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => setTags(tags.filter((x) => x !== t))}
                              style={{ color: MUTED }}
                              aria-label={`remove ${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const tag = prompt("tag name");
                            if (tag) setTags([...tags, tag.replace(/^#/, "")]);
                          }}
                          className="rounded-full border bg-white px-2 py-0.5 font-mono text-[11px]"
                          style={{ borderColor: HAIR, color: MUTED }}
                        >
                          + add
                        </button>
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Detected project">
                        <select
                          value={project}
                          onChange={(e) => setProject(e.target.value)}
                          className="w-full rounded-[6px] border bg-white px-2 py-1.5 font-sans text-[13px] outline-none"
                          style={{ borderColor: HAIR, color: INK }}
                        >
                          <option value="northstar">Northstar Cloud</option>
                          <option value="payments">Payments revamp</option>
                          <option value="agent">Agent platform</option>
                          <option value="devx">DevX</option>
                          <option value="">(none)</option>
                        </select>
                      </Field>
                      <Field label="Access level">
                        <select
                          value={access}
                          onChange={(e) => setAccess(e.target.value as AccessLevel)}
                          className="w-full rounded-[6px] border bg-white px-2 py-1.5 font-sans text-[13px] outline-none"
                          style={{ borderColor: HAIR, color: INK }}
                        >
                          <option value="public-team">Public to team</option>
                          <option value="project-only">Project-only</option>
                          <option value="role-restricted">Role-restricted</option>
                          <option value="private">Private</option>
                          <option value="human-only">Human-only (no agent)</option>
                        </select>
                      </Field>
                    </div>

                    <Toggle
                      checked={truth}
                      onChange={setTruth}
                      label={
                        <span>
                          Mark as <span style={{ color: TEAL }}>source of truth</span> on{" "}
                          <input
                            value={truthTopic}
                            onChange={(e) => setTruthTopic(e.target.value)}
                            disabled={!truth}
                            placeholder="topic"
                            className="ml-1 rounded-[4px] border bg-white px-1.5 py-0.5 font-mono text-[11px] outline-none disabled:opacity-50"
                            style={{ borderColor: HAIR, color: INK, width: 160 }}
                          />
                        </span>
                      }
                    />
                    <Toggle
                      checked={hasExpiry}
                      onChange={setHasExpiry}
                      label={
                        <span>
                          Set expiry date{" "}
                          <input
                            type="date"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            disabled={!hasExpiry}
                            className="ml-1 rounded-[4px] border bg-white px-1.5 py-0.5 font-mono text-[11px] outline-none disabled:opacity-50"
                            style={{ borderColor: HAIR, color: INK }}
                          />
                        </span>
                      }
                    />
                  </motion.div>
                ) : null}
              </>
            )}
          </div>

          <footer
            className="flex items-center justify-between gap-3 border-t px-5 py-3"
            style={{ borderColor: HAIR }}
          >
            <span className="font-mono text-[10px]" style={{ color: MUTED }}>
              {items.length === 0
                ? "esc to close"
                : allDone
                ? "review metadata, then save"
                : "processing — you can keep adding files"}
            </span>
            <div className="flex items-center gap-2">
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
                disabled={!allDone}
                onClick={save}
                className="rounded-[6px] px-4 py-1.5 font-sans text-[12px] text-white disabled:opacity-40"
                style={{ background: RUST }}
              >
                save to brain
              </button>
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        {label.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
        style={{ background: checked ? RUST : "#D9CFC3" }}
      >
        <motion.span
          animate={{ x: checked ? 14 : 2 }}
          transition={{ duration: 0.18 }}
          className="inline-block h-3 w-3 rounded-full bg-white"
        />
      </button>
      <span className="font-sans text-[12px]" style={{ color: INK }}>
        {label}
      </span>
    </label>
  );
}

// ─── Heuristics ────────────────────────────────────────────────────────────

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function suggestTitle(name: string) {
  return name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ");
}

function suggestSummary(name: string) {
  return `Auto-summary of ${name}. The brain has parsed the content, extracted entities, and embedded the document. Edit this summary to capture what teammates actually need to know about it.`;
}

function suggestTags(name: string) {
  const base = ["just-added"];
  if (/api|endpoint/i.test(name)) base.push("api");
  if (/rfc|spec/i.test(name)) base.push("rfc");
  if (/onboard/i.test(name)) base.push("onboarding");
  if (/auth|session/i.test(name)) base.push("auth");
  return base;
}

function suggestTopic(name: string) {
  if (/auth/i.test(name)) return "auth flow";
  if (/comms/i.test(name)) return "comms api";
  if (/pricing/i.test(name)) return "pricing";
  return "";
}
