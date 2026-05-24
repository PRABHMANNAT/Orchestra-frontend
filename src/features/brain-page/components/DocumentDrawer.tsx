import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Doc } from "../data/mockBrainData";
import { hasOpenAIKey, streamChat } from "../../../lib/openaiClient";

type Props = {
  doc: Doc | null;
  onClose: () => void;
};

const TABS = ["Content", "Lineage", "Used By", "Access", "Comments"] as const;
type Tab = (typeof TABS)[number];

const SUMMARY_SYSTEM = `You are summarizing a memory in Northstar Cloud's company brain. Output a 2-3 sentence summary that captures: what it is, the key rationale or decision, and why someone fetching it would care. Calm tone. No emoji. No headers.`;

export function DocumentDrawer({ doc, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("Content");
  const [summary, setSummary] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Reset summary when a different doc opens
  useEffect(() => {
    setSummary(null);
    setRegenerating(false);
  }, [doc?.id]);

  async function regenerate() {
    if (!doc) return;
    if (!hasOpenAIKey()) {
      // Demo mode: just rewrite the seed summary
      setSummary(doc.summary + " · regenerated (demo)");
      return;
    }
    setRegenerating(true);
    setSummary("");
    const ctx = `Title: ${doc.title}\nType: ${doc.type}\nSource: ${doc.source}\nDomain: ${doc.domain}\nFreshness: ${doc.freshness}\nSeed summary: ${doc.summary}`;
    await streamChat(
      [
        { role: "system", content: SUMMARY_SYSTEM },
        { role: "user", content: ctx }
      ],
      (chunk) => setSummary((s) => (s ?? "") + chunk),
      { temperature: 0.4, max_tokens: 180 }
    );
    setRegenerating(false);
  }

  return (
    <AnimatePresence>
      {doc ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[rgba(26,22,18,0.16)]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 540 }}
            animate={{ x: 0 }}
            exit={{ x: 540 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[520px] flex-col border-l border-[rgba(26,22,18,0.08)] bg-[#FAF8F5]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[rgba(26,22,18,0.08)] p-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">
                  Northstar Cloud / Brain / {doc.type}
                </div>
                <h2 className="mt-1.5 font-serif text-[22px] leading-[1.2] text-[#1A1612]">{doc.title}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-[3px] bg-[rgba(26,22,18,0.08)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5A5450]">
                    {doc.type}
                  </span>
                  <span className="font-mono text-[11px] text-[#8A7E6F]">{doc.source}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white p-1.5 text-[#5A5450] hover:bg-[#FAF8F5]"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <div className="border-b border-[rgba(26,22,18,0.08)] p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">AI auto-summary</div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-[1.6] text-[#1A1612]">
                {summary ?? doc.summary}
              </p>
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#B8543D] hover:text-[#8C3E28] disabled:opacity-50"
              >
                {regenerating ? "↻ streaming…" : "↻ Regenerate"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b border-[rgba(26,22,18,0.08)] px-5 py-3">
              {["Open original", "Edit metadata", "Mark source of truth", "Flag stale", "Archive", "Share", "Copy citation"].map((a) => (
                <button
                  key={a}
                  className="rounded-[3px] border border-[rgba(26,22,18,0.08)] bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#5A5450] hover:bg-[#FAF8F5]"
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="flex border-b border-[rgba(26,22,18,0.08)] px-5">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative px-3 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors ${
                    tab === t ? "text-[#1A1612]" : "text-[#8A7E6F] hover:text-[#1A1612]"
                  }`}
                >
                  {t}
                  {tab === t ? (
                    <span className="absolute -bottom-px left-3 right-3 h-[2px] bg-[#B8543D]" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "Content" ? <ContentTab doc={doc} /> : null}
              {tab === "Lineage" ? <LineageTab /> : null}
              {tab === "Used By" ? <UsedByTab doc={doc} /> : null}
              {tab === "Access" ? <AccessTab doc={doc} /> : null}
              {tab === "Comments" ? <CommentsTab /> : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ContentTab({ doc }: { doc: Doc }) {
  return (
    <article className="space-y-3 font-serif text-[14.5px] leading-[1.7] text-[#1A1612]">
      <h3 className="font-serif text-[19px] text-[#1A1612]">{doc.title}</h3>
      <p>{doc.summary}</p>
      <p>
        This memory was ingested from <span className="font-mono text-[12px]">{doc.source}</span> and last touched by{" "}
        <span className="font-mono text-[12px]">{doc.uploader.name}</span>. It has been referenced{" "}
        <span className="font-mono text-[12px]">{doc.fetchCount}</span> times by agents and humans in the last 30 days.
      </p>
      <p className="text-[#5A5450]">
        The decision rationale is captured in three sections: context, alternatives considered, and the chosen path
        forward. Linked RFCs, Linear epics, and customer asks are surfaced in the Lineage tab.
      </p>
    </article>
  );
}

function LineageTab() {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">References</div>
        <ul className="space-y-1 text-[13px] text-[#1A1612]">
          <li>↳ Auth migration strategy</li>
          <li>↳ Decision: JWT over sessions</li>
          <li>↳ Incident runbook 0524</li>
        </ul>
      </div>
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Referenced by</div>
        <ul className="space-y-1 text-[13px] text-[#1A1612]">
          <li>← Northstar architecture overview</li>
          <li>← Acme SSO requirements</li>
        </ul>
      </div>
    </div>
  );
}

function UsedByTab({ doc }: { doc: Doc }) {
  return (
    <div className="space-y-3 font-mono text-[11.5px] text-[#5A5450]">
      <div className="text-[#1A1612]">Fetched {doc.fetchCount} times this month</div>
      <div>· Scout · 2026-05-24 08:42 · context for Acme call</div>
      <div>· Historian · 2026-05-23 14:11 · "why JWT" for Kartikeya</div>
      <div>· Marcus T · 2026-05-23 09:50 · viewed</div>
      <div>· Curator · 2026-05-22 18:33 · freshness check</div>
    </div>
  );
}

function AccessTab({ doc }: { doc: Doc }) {
  const rows = [
    { role: "Engineering", read: true, write: true, agent: true },
    { role: "Product", read: true, write: false, agent: true },
    { role: "Design", read: true, write: false, agent: false },
    { role: "Sales", read: !doc.restricted, write: false, agent: doc.agentAccessible },
    { role: "Legal", read: true, write: true, agent: false }
  ];
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">
          <th className="py-2">Role</th>
          <th className="py-2">Read</th>
          <th className="py-2">Write</th>
          <th className="py-2">Agent</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.role} className="border-t border-[rgba(26,22,18,0.06)]">
            <td className="py-2 text-[#1A1612]">{r.role}</td>
            <td className="py-2">{r.read ? "✓" : "—"}</td>
            <td className="py-2">{r.write ? "✓" : "—"}</td>
            <td className="py-2">{r.agent ? "✓" : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CommentsTab() {
  return (
    <div className="space-y-3 text-[13px]">
      <div className="rounded-[3px] border border-[rgba(26,22,18,0.08)] bg-white p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">Kartikeya · 2d ago</div>
        <div className="mt-1 text-[#1A1612]">We should clarify the refresh token TTL — RFC and runbook disagree.</div>
      </div>
      <div className="rounded-[3px] border border-[rgba(26,22,18,0.08)] bg-white p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A7E6F]">Curator · 8h ago</div>
        <div className="mt-1 text-[#1A1612]">Flagged this for review — last update was 21 days ago.</div>
      </div>
    </div>
  );
}
