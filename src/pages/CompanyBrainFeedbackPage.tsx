import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TbCheck,
  TbHistory,
  TbMessage2,
  TbPencil,
  TbRobot,
  TbX
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import { DocMiniRef, PersonDisc } from "../features/company-brain/components/BrainBits";
import {
  FEEDBACK,
  HAIR,
  INK,
  MUTED,
  PURPLE,
  RUST,
  TEAL,
  personById
} from "../features/company-brain/data";

const ease = [0.22, 1, 0.36, 1] as const;

type StatusFilter = "open" | "resolved" | "dismissed" | "all";

export default function CompanyBrainFeedbackPage() {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [openId, setOpenId] = useState<string | null>(FEEDBACK[0]?.id ?? null);

  const filtered = useMemo(
    () => (status === "all" ? FEEDBACK : FEEDBACK.filter((f) => f.status === status)),
    [status]
  );

  const counts = {
    open: FEEDBACK.filter((f) => f.status === "open").length,
    resolved: FEEDBACK.filter((f) => f.status === "resolved").length,
    dismissed: FEEDBACK.filter((f) => f.status === "dismissed").length,
    all: FEEDBACK.length
  };

  const selected = filtered.find((f) => f.id === openId) ?? filtered[0];

  return (
    <BrainShell
      topBar={
        <BrainTopBar
          breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Agent feedback" }]}
          title="Agent feedback"
        />
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* list */}
        <aside className="h-full overflow-y-auto border-r" style={{ borderColor: HAIR }}>
          <div className="flex gap-1.5 border-b px-4 py-3" style={{ borderColor: HAIR }}>
            {(["open", "resolved", "dismissed", "all"] as StatusFilter[]).map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]"
                  style={{
                    background: active ? `${RUST}14` : "transparent",
                    color: active ? RUST : MUTED,
                    borderColor: active ? `${RUST}55` : HAIR
                  }}
                >
                  {s}
                  <span
                    className="rounded-full px-1.5 font-mono text-[10px]"
                    style={{ background: active ? `${RUST}22` : "#F1ECE4", color: active ? RUST : MUTED }}
                  >
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
          <ul>
            {filtered.map((f) => {
              const flagger = personById(f.flaggedBy);
              const active = selected?.id === f.id;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(f.id)}
                    className="block w-full px-4 py-3 text-left"
                    style={{
                      borderBottom: `1px solid ${HAIR}`,
                      background: active ? "#FBF7F1" : "transparent"
                    }}
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
                      <TbRobot className="h-3 w-3" strokeWidth={1.5} style={{ color: PURPLE }} />
                      agent · cited {f.citedDocTitle}
                    </div>
                    <p className="mt-1 line-clamp-2 font-sans text-[13px]" style={{ color: INK }}>
                      Q: {f.question}
                    </p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
                      <PersonDisc person={flagger} size={14} />
                      flagged by {flagger?.name} · {f.ts}
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-4 py-10 text-center font-sans text-[13px]" style={{ color: MUTED }}>
                empty inbox. nice.
              </li>
            ) : null}
          </ul>
        </aside>

        {/* detail */}
        <section className="h-full overflow-y-auto p-6">
          {selected ? <FeedbackDetail feedback={selected} /> : null}
        </section>
      </div>
    </BrainShell>
  );
}

function FeedbackDetail({ feedback }: { feedback: typeof FEEDBACK[number] }) {
  const [replied, setReplied] = useState(false);
  const flagger = personById(feedback.flaggedBy);

  return (
    <motion.div
      key={feedback.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease }}
      className="mx-auto max-w-[760px]"
    >
      <header className="mb-4">
        <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
          AGENT FEEDBACK · #{feedback.id}
        </p>
        <h1 className="mt-1 font-sans text-[20px]" style={{ color: INK }}>
          {feedback.question}
        </h1>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px]" style={{ color: MUTED }}>
          <PersonDisc person={flagger} size={16} />
          flagged by {flagger?.name} · {feedback.ts}
        </div>
      </header>

      {/* answer */}
      <section className="rounded-[8px] border p-4" style={{ borderColor: HAIR, background: `${PURPLE}06` }}>
        <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em]" style={{ color: PURPLE }}>
          <TbRobot className="h-3.5 w-3.5" strokeWidth={1.5} />
          AGENT ANSWER
        </p>
        <p className="font-sans text-[13px] leading-6" style={{ color: INK }}>
          {feedback.answer}
        </p>
        <div className="mt-2 flex items-center gap-2 font-mono text-[11px]" style={{ color: MUTED }}>
          cited:
          <DocMiniRef docId={feedback.citedDocId} />
        </div>
      </section>

      {/* correction */}
      <section className="mt-3 rounded-[8px] border p-4" style={{ borderColor: `${RUST}55`, background: `${RUST}06` }}>
        <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em]" style={{ color: RUST }}>
          <TbPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
          HUMAN CORRECTION
        </p>
        <p className="font-sans text-[13px] leading-6" style={{ color: INK }}>
          {feedback.correction}
        </p>
      </section>

      {/* actions */}
      <section className="mt-4 grid gap-2 sm:grid-cols-2">
        <ActionBtn icon={<TbPencil className="h-3.5 w-3.5" strokeWidth={1.5} />} accent={RUST}>
          Update the cited doc
        </ActionBtn>
        <ActionBtn icon={<TbHistory className="h-3.5 w-3.5" strokeWidth={1.5} />} accent={ORANGE_LIKE}>
          Mark doc stale
        </ActionBtn>
        <ActionBtn icon={<TbX className="h-3.5 w-3.5" strokeWidth={1.5} />} accent={MUTED}>
          Dismiss feedback
        </ActionBtn>
        <ActionBtn
          icon={replied ? <TbCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> : <TbMessage2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
          accent={TEAL}
          onClick={() => setReplied(true)}
        >
          {replied ? "Reply sent" : "Reply to flagger"}
        </ActionBtn>
      </section>

      <section className="mt-6 rounded-[8px] border p-4" style={{ borderColor: HAIR }}>
        <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
          WHAT HAPPENS WHEN YOU UPDATE
        </p>
        <ol className="mt-2 space-y-1 font-sans text-[12px]" style={{ color: INK }}>
          <li>1. The cited doc is opened in edit mode with the relevant section highlighted.</li>
          <li>2. The agent's response is annotated with "superseded" — anyone who saw it gets a follow-up.</li>
          <li>3. The brain re-indexes and any pack containing this doc reloads on next agent fetch.</li>
        </ol>
      </section>
    </motion.div>
  );
}

const ORANGE_LIKE = "#F59340";

function ActionBtn({
  children,
  icon,
  accent,
  onClick
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-[6px] border px-3 py-2 font-sans text-[12px]"
      style={{ borderColor: HAIR, color: accent }}
    >
      {icon}
      {children}
    </button>
  );
}
