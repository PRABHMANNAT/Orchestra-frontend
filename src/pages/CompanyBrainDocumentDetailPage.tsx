import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  TbAlertTriangle,
  TbArchive,
  TbArrowRight,
  TbChevronDown,
  TbDownload,
  TbExternalLink,
  TbFlag2,
  TbMessage2,
  TbPencil,
  TbRefresh,
  TbRobot,
  TbShare3,
  TbSparkles
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import {
  AccessBadge,
  DocMiniRef,
  FreshnessDot,
  PersonDisc,
  SourceIcon,
  TypeIcon
} from "../features/company-brain/components/BrainBits";
import {
  AUDIT,
  CONFLICTS,
  DOCS,
  HAIR,
  INK,
  MUTED,
  PEOPLE,
  PURPLE,
  RUST,
  TEAL,
  docById,
  personById
} from "../features/company-brain/data";

const ease = [0.22, 1, 0.36, 1] as const;

export default function CompanyBrainDocumentDetailPage() {
  const { docId = "d-001" } = useParams();
  const doc = docById(docId) ?? DOCS[0];
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [regenSpinning, setRegenSpinning] = useState(false);

  const uploader = personById(doc.uploaderId);
  const conflict = useMemo(() => CONFLICTS.find((c) => c.docA.id === doc.id || c.docB.id === doc.id), [doc.id]);
  const conflictOther = conflict ? (conflict.docA.id === doc.id ? conflict.docB : conflict.docA) : null;

  const related = useMemo(() => {
    return DOCS.filter((d) => d.id !== doc.id && (d.projectId === doc.projectId || d.tags.some((t) => doc.tags.includes(t)))).slice(0, 5);
  }, [doc]);

  const referencedIn = useMemo(() => DOCS.filter((d) => d.id !== doc.id && d.content?.includes(doc.title)).slice(0, 4), [doc]);

  const agentUses = useMemo(
    () => AUDIT.filter((a) => a.docId === doc.id && a.actorKind === "agent").length,
    [doc.id]
  );

  return (
    <BrainShell
      topBar={
        <BrainTopBar
          breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Documents", href: "/company-brain/documents" }, { label: doc.title }]}
          actions={
            <div className="flex items-center gap-1">
              <ActionBtn icon={<TbPencil className="h-3.5 w-3.5" strokeWidth={1.5} />}>Edit metadata</ActionBtn>
              <ActionBtn icon={<TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}>Source of truth</ActionBtn>
              <ActionBtn icon={<TbFlag2 className="h-3.5 w-3.5" strokeWidth={1.5} />}>Flag for review</ActionBtn>
              <ActionBtn icon={<TbArchive className="h-3.5 w-3.5" strokeWidth={1.5} />}>Archive</ActionBtn>
              <ActionBtn icon={<TbDownload className="h-3.5 w-3.5" strokeWidth={1.5} />}>Download</ActionBtn>
              <ActionBtn icon={<TbShare3 className="h-3.5 w-3.5" strokeWidth={1.5} />}>Share</ActionBtn>
            </div>
          }
        />
      }
    >
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_320px]">
        {/* main content (70%) */}
        <div className="h-full min-h-0 overflow-y-auto px-8 py-6">
          {/* conflict warning */}
          {conflict ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease }}
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border p-3"
              style={{ borderColor: `${RUST}55`, background: `${RUST}08` }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${RUST}14`, color: RUST }}>
                  <TbAlertTriangle className="h-3 w-3" strokeWidth={1.5} />
                </span>
                <p className="font-sans text-[13px]" style={{ color: INK }}>
                  This contradicts{" "}
                  <Link to={`/company-brain/documents/${conflictOther?.id}`} className="underline" style={{ color: RUST }}>
                    {conflictOther?.title}
                  </Link>{" "}
                  on <span style={{ color: RUST }}>{conflict.topic}</span>.
                </p>
              </div>
              <button
                type="button"
                className="rounded-[6px] px-3 py-1 font-sans text-[12px] text-white"
                style={{ background: RUST }}
              >
                Resolve
              </button>
            </motion.div>
          ) : null}

          {/* title block */}
          <header className="mb-4">
            <div className="flex items-baseline gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              <TypeIcon type={doc.type} className="h-3.5 w-3.5" />
              {doc.type.toUpperCase()} · <SourceIcon source={doc.source} className="h-3 w-3" /> {doc.source}
            </div>
            <h1 className="mt-1 font-sans text-[24px] leading-tight" style={{ color: INK }}>
              {doc.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px]" style={{ color: MUTED }}>
              {doc.tags.map((t) => (
                <span key={t} className="rounded-[4px] bg-[#F1ECE4] px-1.5 py-0.5">
                  #{t}
                </span>
              ))}
              {doc.isSourceOfTruth ? (
                <span className="rounded-full border px-1.5 py-0.5" style={{ color: TEAL, borderColor: `${TEAL}55`, background: `${TEAL}14` }}>
                  source of truth · {doc.isSourceOfTruth}
                </span>
              ) : null}
            </div>
          </header>

          {/* AI auto-summary */}
          <section
            className="mb-6 rounded-[8px] border p-4"
            style={{ borderColor: HAIR, background: `${PURPLE}06` }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em]" style={{ color: PURPLE }}>
                <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                AI AUTO-SUMMARY
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegenSpinning(true);
                  setTimeout(() => setRegenSpinning(false), 700);
                }}
                className="rounded-[6px] p-1 hover:bg-white"
                style={{ color: MUTED }}
                aria-label="regenerate summary"
                title="regenerate"
              >
                <motion.span
                  animate={regenSpinning ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.7, ease: "linear" }}
                  className="inline-block"
                >
                  <TbRefresh className="h-3.5 w-3.5" strokeWidth={1.5} />
                </motion.span>
              </button>
            </div>
            <p className="font-sans text-[13px] leading-6" style={{ color: INK }}>
              {doc.summary}
            </p>
          </section>

          {/* content renderer */}
          <article className="prose-brain">
            {doc.type === "audio" || doc.type === "video" ? (
              <TranscriptRender transcript={doc.transcript ?? []} />
            ) : doc.type === "pdf" ? (
              <PdfTextRender content={doc.content ?? defaultPdfFallback(doc.title)} />
            ) : doc.content ? (
              <MarkdownRender content={doc.content} />
            ) : (
              <p className="font-sans text-[14px]" style={{ color: MUTED }}>
                No parsed content available. Try downloading the original.
              </p>
            )}
          </article>

          {/* comments drawer */}
          <button
            type="button"
            onClick={() => setCommentsOpen((x) => !x)}
            className="mt-8 flex w-full items-center justify-between rounded-[8px] border bg-white px-4 py-3"
            style={{ borderColor: HAIR }}
          >
            <div className="flex items-center gap-2">
              <TbMessage2 className="h-4 w-4" strokeWidth={1.5} style={{ color: MUTED }} />
              <span className="font-sans text-[13px]" style={{ color: INK }}>
                Comments & annotations
              </span>
              <span className="rounded-full bg-[#F1ECE4] px-1.5 py-0.5 font-mono text-[10px]" style={{ color: MUTED }}>
                3
              </span>
            </div>
            <motion.span animate={{ rotate: commentsOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
              <TbChevronDown className="h-4 w-4" strokeWidth={1.5} style={{ color: MUTED }} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {commentsOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-3 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
                  <CommentBubble personId="adhiraj" ts="2h ago" body="Should we link the deploy runbook here too? It still cites bearer auth." />
                  <CommentBubble personId="mannan" ts="1h ago" body="@adhiraj +1 — I'll open a PR to remove the bearer reference in the runbook." />
                  <CommentBubble personId="kartikeya" ts="35m ago" body="Reads great. One nit: section names should be sentence case." />
                  <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: HAIR }}>
                    <PersonDisc person={personById("sarah")} size={22} />
                    <input
                      placeholder="add a comment…"
                      className="flex-1 rounded-[6px] border px-2 py-1.5 font-sans text-[13px] outline-none"
                      style={{ borderColor: HAIR, color: INK }}
                    />
                    <button type="button" className="rounded-[6px] px-3 py-1.5 font-sans text-[12px] text-white" style={{ background: RUST }}>
                      send
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* metadata rail (30%) */}
        <aside
          className="h-full overflow-y-auto border-l p-5"
          style={{ borderColor: HAIR, background: "#FBF7F1" }}
        >
          <section className="rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              METADATA
            </p>
            <dl className="space-y-2 text-[12px]">
              <Row label="Uploader">
                <PersonDisc person={uploader} size={18} />
                <span style={{ color: INK }}>{uploader?.name}</span>
              </Row>
              <Row label="Uploaded"><span style={{ color: INK }}>{doc.uploadedAt}</span></Row>
              <Row label="Modified"><span style={{ color: INK }}>{doc.modifiedAt ?? doc.uploadedAt}</span></Row>
              <Row label="Source">
                <SourceIcon source={doc.source} />
                <span style={{ color: INK }}>{doc.source}</span>
              </Row>
              <Row label="Access"><AccessBadge value={doc.access} /></Row>
              <Row label="Freshness"><FreshnessDot value={doc.freshness} withLabel /></Row>
              <Row label="Expires"><span style={{ color: doc.expiresAt ? RUST : MUTED }}>{doc.expiresAt ?? "no expiry"}</span></Row>
              <Row label="Project"><span style={{ color: INK }}>{doc.projectId ?? "—"}</span></Row>
            </dl>
          </section>

          <section className="mt-3 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              VERSION HISTORY
            </p>
            <ul className="space-y-1.5">
              {(doc.versions ?? [
                { v: "v3 (current)", ts: doc.uploadedAt, by: uploader?.name ?? "—" },
                { v: "v2", ts: "1 week ago", by: "Adhiraj" },
                { v: "v1", ts: "1 month ago", by: "Adhiraj" }
              ]).map((v) => (
                <li key={v.v} className="flex items-center justify-between gap-2 rounded-[6px] border px-2 py-1.5" style={{ borderColor: HAIR }}>
                  <span className="font-sans text-[12px]" style={{ color: INK }}>{v.v}</span>
                  <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {v.by} · {v.ts}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-3 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              RELATED DOCUMENTS
            </p>
            <ul className="space-y-1.5">
              {related.length === 0 ? (
                <li className="font-mono text-[11px]" style={{ color: MUTED }}>
                  no semantic neighbours yet
                </li>
              ) : (
                related.map((r) => (
                  <li key={r.id} className="rounded-[6px] border px-2 py-1.5" style={{ borderColor: HAIR }}>
                    <DocMiniRef docId={r.id} />
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="mt-3 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
              REFERENCED IN
            </p>
            <ul className="space-y-1.5">
              {referencedIn.length === 0 ? (
                <li className="font-mono text-[11px]" style={{ color: MUTED }}>
                  not yet cited by another doc
                </li>
              ) : (
                referencedIn.map((r) => (
                  <li key={r.id}>
                    <DocMiniRef docId={r.id} />
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="mt-3 rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
                USED BY AGENTS
              </p>
              <span className="font-sans text-[16px]" style={{ color: PURPLE }}>
                {doc.fetchedThisWeek?.agents ?? agentUses}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
              this week
            </p>
            <Link
              to="/company-brain/audit"
              className="mt-2 inline-flex items-center gap-1 font-sans text-[12px]"
              style={{ color: RUST }}
            >
              audit log <TbArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </section>
        </aside>
      </div>
    </BrainShell>
  );
}

function ActionBtn({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 font-sans text-[11px] hover:bg-[#FAF8F5]"
      style={{ borderColor: HAIR, color: INK }}
    >
      {icon}
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="font-mono text-[10px]" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd className="flex items-center gap-1.5">{children}</dd>
    </div>
  );
}

function CommentBubble({ personId, ts, body }: { personId: string; ts: string; body: string }) {
  const p = personById(personId);
  return (
    <div className="flex items-start gap-2">
      <PersonDisc person={p} size={22} />
      <div className="min-w-0 flex-1 rounded-[8px] border p-2" style={{ borderColor: HAIR, background: "#FBF7F1" }}>
        <div className="flex items-baseline gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
          <span style={{ color: INK }}>{p?.name}</span>
          <span>{ts}</span>
        </div>
        <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: INK }}>{body}</p>
      </div>
    </div>
  );
}

// ─── Content renderers ────────────────────────────────────────────────────

function MarkdownRender({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 font-sans text-[14px] leading-7" style={{ color: INK }}>
      {lines.map((l, i) => {
        if (l.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-4 font-sans text-[16px] leading-tight" style={{ color: INK }}>
              {l.slice(3)}
            </h3>
          );
        }
        if (l.startsWith("# ")) {
          return (
            <h2 key={i} className="mt-4 font-sans text-[18px] leading-tight" style={{ color: INK }}>
              {l.slice(2)}
            </h2>
          );
        }
        if (l.startsWith("- ")) {
          return (
            <p key={i} className="pl-4">
              <span style={{ color: MUTED }}>·</span> {l.slice(2)}
            </p>
          );
        }
        if (l.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i}>{l}</p>;
      })}
    </div>
  );
}

function TranscriptRender({ transcript }: { transcript: { ts: string; text: string }[] }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        TRANSCRIPT
      </p>
      <ul className="space-y-3">
        {transcript.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="rounded-[4px] bg-[#F1ECE4] px-1.5 py-0.5 font-mono text-[10px]" style={{ color: MUTED }}>
              {t.ts}
            </span>
            <p className="flex-1 font-sans text-[14px] leading-7" style={{ color: INK }}>
              {t.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PdfTextRender({ content }: { content: string }) {
  return (
    <div className="rounded-[8px] border p-4" style={{ borderColor: HAIR, background: "white" }}>
      <p className="mb-3 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        PARSED FROM PDF · page 1 of 12
      </p>
      <MarkdownRender content={content} />
      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: HAIR }}>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          page anchors enabled · jump with [pN]
        </span>
        <button type="button" className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: INK }}>
          <TbExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          open original
        </button>
      </div>
    </div>
  );
}

function defaultPdfFallback(title: string) {
  return `# ${title}\n\nPDF parsing complete. Page 1 of 12 shown below.\n\n## Executive summary\nThis document was uploaded to the brain and parsed for searchable text. Page anchors are enabled — agents can cite specific pages directly.\n\n## Section 1\nLorem ipsum content extracted from the PDF body. Continue reading the original for full context.`;
}
