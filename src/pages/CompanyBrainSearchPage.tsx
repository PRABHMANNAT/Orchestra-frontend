import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TbArrowRight,
  TbBubbleText,
  TbCircleFilled,
  TbCommand,
  TbExternalLink,
  TbHistory,
  TbSearch,
  TbSparkles
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import {
  FilterChip,
  PersonDisc,
  ResultActions,
  SourceIcon,
  TypeIcon
} from "../features/company-brain/components/BrainBits";
import {
  DOCS,
  HAIR,
  INK,
  MUTED,
  PEOPLE,
  PROJECTS,
  PURPLE,
  RUST,
  TEAL,
  docById,
  personById
} from "../features/company-brain/data";
import type { AccessLevel, BrainDoc, DocSource } from "../features/company-brain/types";
import { UploadModal } from "../features/company-brain/components/UploadModal";

const SUGGESTED_QUESTIONS = [
  "How do we authenticate in v1?",
  "What's the canonical Comm payload shape?",
  "Where does the agent pack come from for a payments task?",
  "What did Lisa F. say about agent trust?",
  "Which docs were flagged stale this month?"
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function CompanyBrainSearchPage() {
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Filters
  const [fAccess, setFAccess] = useState<AccessLevel[]>([]);
  const [fProject, setFProject] = useState<string[]>([]);
  const [fOwner, setFOwner] = useState<string[]>([]);
  const [fSource, setFSource] = useState<DocSource[]>([]);
  const [fDate, setFDate] = useState<"any" | "today" | "week" | "month">("any");

  const isQuestion = /\?$/.test(query.trim()) || /^(how|what|where|when|who|why|can|should|does|do)\b/i.test(query.trim());

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { doc: BrainDoc; score: number; snippet: string }[];
    const out = DOCS.map((d) => {
      let score = 0;
      const hay = `${d.title} ${d.summary} ${d.tags.join(" ")}`.toLowerCase();
      const titleHit = d.title.toLowerCase().includes(q);
      if (titleHit) score += 0.5;
      if (hay.includes(q)) score += 0.25;
      const words = q.split(/\s+/).filter(Boolean);
      words.forEach((w) => {
        if (hay.includes(w)) score += 0.05;
      });
      // filters
      if (fAccess.length && !fAccess.includes(d.access)) return null;
      if (fProject.length && (!d.projectId || !fProject.includes(d.projectId))) return null;
      if (fOwner.length && !fOwner.includes(d.uploaderId)) return null;
      if (fSource.length && !fSource.includes(d.source)) return null;
      const snippet = excerpt(d, q);
      return score > 0 ? { doc: d, score: Math.min(1, score), snippet } : null;
    }).filter(Boolean) as { doc: BrainDoc; score: number; snippet: string }[];
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 8);
  }, [query, fAccess, fProject, fOwner, fSource]);

  const related = useMemo(() => {
    if (!query.trim()) return [] as { label: string; query: string }[];
    return [
      { label: "session refresh", query: "session refresh" },
      { label: "context packs", query: "context packs" },
      { label: "comm payload", query: "comm payload shape" },
      { label: "v0 → v1 migration", query: "v0 to v1 migration" },
      { label: "agent feedback flow", query: "agent feedback flow" }
    ];
  }, [query]);

  const topFetched = useMemo(
    () =>
      DOCS.slice()
        .sort(
          (a, b) =>
            (b.fetchedThisWeek?.humans ?? 0) +
            (b.fetchedThisWeek?.agents ?? 0) -
            ((a.fetchedThisWeek?.humans ?? 0) + (a.fetchedThisWeek?.agents ?? 0))
        )
        .slice(0, 5),
    []
  );

  return (
    <>
      <BrainShell
        onUploadClick={() => setUploadOpen(true)}
        topBar={
          <BrainTopBar
            breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Search" }]}
            onUploadClick={() => setUploadOpen(true)}
            onPasteClick={() => setUploadOpen(true)}
          />
        }
      >
        <div className="mx-auto max-w-[920px] px-6 py-6">
          {/* big search panel */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease }}
            className="rounded-[10px] border bg-white p-5"
            style={{ borderColor: HAIR }}
          >
            <div className="flex items-center gap-3">
              <TbSearch className="h-5 w-5" strokeWidth={1.5} style={{ color: MUTED }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ask anything, or type a keyword"
                className="flex-1 bg-transparent font-sans text-[18px] outline-none placeholder:text-[#A09790]"
                style={{ color: INK }}
              />
              <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px]" style={{ borderColor: HAIR, color: MUTED }}>
                <TbCommand className="h-3 w-3" strokeWidth={1.5} /> K
              </span>
            </div>

            {/* filter chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(["public-team", "project-only", "role-restricted", "private", "human-only"] as AccessLevel[]).map((a) => (
                <FilterChip
                  key={a}
                  label={`access · ${a}`}
                  active={fAccess.includes(a)}
                  onClick={() => setFAccess((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]))}
                />
              ))}
              {PROJECTS.map((p) => (
                <FilterChip
                  key={p.id}
                  label={p.name}
                  active={fProject.includes(p.id)}
                  onClick={() => setFProject((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                />
              ))}
              {PEOPLE.slice(0, 4).map((p) => (
                <FilterChip
                  key={p.id}
                  label={`by ${p.name.split(" ")[0]}`}
                  active={fOwner.includes(p.id)}
                  onClick={() => setFOwner((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                />
              ))}
              {(["drive", "github", "notion", "slack", "loom", "manual"] as DocSource[]).map((s) => (
                <FilterChip
                  key={s}
                  label={s}
                  active={fSource.includes(s)}
                  onClick={() => setFSource((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]))}
                />
              ))}
            </div>
          </motion.div>

          {/* results / empty state */}
          {query.trim().length === 0 ? (
            <EmptyState topFetched={topFetched} onSuggest={setQuery} />
          ) : (
            <div className="mt-6 space-y-6">
              {isQuestion ? <DirectAnswer query={query} matches={matches} /> : null}

              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-sans text-[14px]" style={{ color: INK }}>
                    Matching documents
                  </h2>
                  <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {matches.length} hits
                  </span>
                </div>
                <ul className="space-y-3">
                  {matches.map((m) => (
                    <ResultCard key={m.doc.id} doc={m.doc} score={m.score} snippet={m.snippet} />
                  ))}
                  {matches.length === 0 ? (
                    <li className="rounded-[8px] border bg-white p-6 text-center font-sans text-[13px]" style={{ borderColor: HAIR, color: MUTED }}>
                      Nothing in the brain matches that yet.
                    </li>
                  ) : null}
                </ul>
              </section>

              <section>
                <h2 className="mb-3 font-sans text-[14px]" style={{ color: INK }}>
                  Related concepts
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {related.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setQuery(r.query)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[11px]"
                      style={{ borderColor: HAIR, color: INK }}
                    >
                      <TbCircleFilled className="h-1.5 w-1.5" style={{ color: PURPLE }} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </section>

              <section
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border p-4"
                style={{ borderColor: HAIR, background: `${PURPLE}08` }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${PURPLE}14`, color: PURPLE }}>
                    <TbBubbleText className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-sans text-[14px]" style={{ color: INK }}>
                      Not finding it? Ask the brain.
                    </p>
                    <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>
                      Opens a chat with these {matches.length} docs loaded as context.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 font-sans text-[12px] text-white"
                  style={{ background: PURPLE }}
                >
                  Ask the brain <TbArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </section>
            </div>
          )}
        </div>
      </BrainShell>
      {uploadOpen ? <UploadModal onClose={() => setUploadOpen(false)} /> : null}
    </>
  );
}

// ─── Direct answer (only if query looks like a question) ──────────────────

function DirectAnswer({ query, matches }: { query: string; matches: { doc: BrainDoc; snippet: string }[] }) {
  const cites = matches.slice(0, 3);
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease }}
      className="rounded-[10px] border p-4"
      style={{ borderColor: `${PURPLE}55`, background: `${PURPLE}06` }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em]" style={{ color: PURPLE }}>
          <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          DIRECT ANSWER
        </p>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          drafted from {cites.length} sources · 1.4s
        </span>
      </div>
      <p className="font-sans text-[14px] leading-6" style={{ color: INK }}>
        {synthesizeAnswer(query)}{" "}
        {cites.map((c, i) => (
          <a
            key={c.doc.id}
            href={`/company-brain/documents/${c.doc.id}`}
            className="inline-block rounded-[3px] px-1 font-mono text-[11px]"
            style={{ color: PURPLE, background: `${PURPLE}14` }}
          >
            [{i + 1}]
          </a>
        ))}
      </p>
      <ol className="mt-3 space-y-1.5">
        {cites.map((c, i) => (
          <li key={c.doc.id} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: MUTED }}>
            <span style={{ color: PURPLE }}>[{i + 1}]</span>
            <Link to={`/company-brain/documents/${c.doc.id}`} className="hover:underline" style={{ color: INK }}>
              {c.doc.title}
            </Link>
            <span>· {c.doc.uploadedAt}</span>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

function synthesizeAnswer(q: string) {
  const lower = q.toLowerCase();
  if (lower.includes("auth")) {
    return "Northstar v1 authenticates users with an httpOnly cookie named ns_session, rotating every 24 hours. The cookie middleware silently issues a new one if the refresh token is still valid. Bearer-in-header is deprecated and 404s by Friday.";
  }
  if (lower.includes("comm") || lower.includes("payload")) {
    return "The v1 Comm payload uses message (renamed from body), with id, author, createdAt, and a cursor for pagination. Page size is 25. Legacy notes that still treat body as canonical are pre-v1 and should not be cited.";
  }
  if (lower.includes("pack") || lower.includes("context")) {
    return "Context packs are curated bundles loaded into an agent on a matching trigger — file glob, project, or task type. Authoring is restricted to project owners and platform-eng per RFC #042; the loom from earlier predates the restriction.";
  }
  return "Here's what the brain found across the most relevant docs. Open a citation below to verify, or click \"ask the brain\" to drill in.";
}

// ─── Result card ──────────────────────────────────────────────────────────

function ResultCard({ doc, score, snippet }: { doc: BrainDoc; score: number; snippet: string }) {
  const uploader = personById(doc.uploaderId);
  return (
    <li className="rounded-[8px] border bg-white p-3" style={{ borderColor: HAIR }}>
      <div className="flex items-start gap-3">
        <TypeIcon type={doc.type} className="mt-0.5 h-4 w-4" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link to={`/company-brain/documents/${doc.id}`} className="truncate font-sans text-[14px] hover:underline" style={{ color: INK }}>
              {doc.title}
            </Link>
            <span className="font-mono text-[10px]" style={{ color: MUTED }}>
              · {doc.uploadedAt} · {uploader?.name}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 font-sans text-[12px] leading-5" style={{ color: MUTED }} dangerouslySetInnerHTML={{ __html: snippet }} />
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            relevance
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <div className="h-1 w-14 overflow-hidden rounded-full" style={{ background: HAIR }}>
              <div className="h-full" style={{ background: TEAL, width: `${score * 100}%` }} />
            </div>
            <span className="font-mono text-[10px]" style={{ color: INK }}>
              {Math.round(score * 100)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
          <SourceIcon source={doc.source} />
          <span>{doc.source}</span>
          {doc.isSourceOfTruth ? (
            <span className="rounded-full px-1.5 py-0.5" style={{ background: `${TEAL}14`, color: TEAL }}>
              source of truth · {doc.isSourceOfTruth}
            </span>
          ) : null}
        </div>
        <ResultActions docId={doc.id} />
      </div>
    </li>
  );
}

function excerpt(d: BrainDoc, q: string) {
  if (!q) return d.summary;
  const lower = d.summary.toLowerCase();
  const idx = lower.indexOf(q);
  const safe = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] || c));
  if (idx < 0) return safe(d.summary);
  const start = Math.max(0, idx - 40);
  const end = Math.min(d.summary.length, idx + q.length + 80);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < d.summary.length ? "…" : "";
  const chunk = d.summary.slice(start, end);
  const inLower = chunk.toLowerCase();
  const matchStart = inLower.indexOf(q);
  if (matchStart < 0) return safe(prefix + chunk + suffix);
  const before = safe(chunk.slice(0, matchStart));
  const hit = safe(chunk.slice(matchStart, matchStart + q.length));
  const after = safe(chunk.slice(matchStart + q.length));
  return `${prefix}${before}<mark style="background:${"#FFF1D6"};color:${INK};padding:0 2px;border-radius:3px">${hit}</mark>${after}${suffix}`;
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ topFetched, onSuggest }: { topFetched: BrainDoc[]; onSuggest: (q: string) => void }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
            TOP FETCHED THIS WEEK
          </p>
          <TbHistory className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: MUTED }} />
        </div>
        <ul className="space-y-2">
          {topFetched.map((d) => {
            const total = (d.fetchedThisWeek?.humans ?? 0) + (d.fetchedThisWeek?.agents ?? 0);
            return (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-[6px] border px-2.5 py-1.5" style={{ borderColor: HAIR }}>
                <Link to={`/company-brain/documents/${d.id}`} className="flex min-w-0 items-center gap-2 hover:underline" style={{ color: INK }}>
                  <TypeIcon type={d.type} className="h-3.5 w-3.5" />
                  <span className="truncate font-sans text-[13px]">{d.title}</span>
                </Link>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {total}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
        <p className="mb-3 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          PEOPLE ARE ASKING
        </p>
        <ul className="space-y-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => onSuggest(q)}
                className="flex w-full items-center gap-2 rounded-[6px] border px-2.5 py-1.5 text-left font-sans text-[13px] hover:bg-[#FAF8F5]"
                style={{ borderColor: HAIR, color: INK }}
              >
                <TbSparkles className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: PURPLE }} />
                {q}
                <TbArrowRight className="ml-auto h-3.5 w-3.5" strokeWidth={1.5} style={{ color: MUTED }} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
