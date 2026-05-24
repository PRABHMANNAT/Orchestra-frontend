import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  TbBrandGithub,
  TbBrandGoogleDrive,
  TbBrandNotion,
  TbBrandSlack,
  TbBrandZoom,
  TbCode,
  TbCopy,
  TbFile,
  TbFileMusic,
  TbFileText,
  TbFileTypeDocx,
  TbFileTypePdf,
  TbFlag2,
  TbLink,
  TbLock,
  TbPhoto,
  TbPlus,
  TbShare3,
  TbVideo
} from "react-icons/tb";
import type { AccessLevel, BrainDoc, DocSource, DocType, Freshness, Person } from "../types";
import { HAIR, INK, MUTED, ORANGE, PURPLE, RUST, TEAL, docById, personById } from "../data";

// ─── Person disc ───────────────────────────────────────────────────────────

export function PersonDisc({ person, size = 22 }: { person?: Person; size?: number }) {
  if (!person) return null;
  return (
    <span
      title={person.name}
      aria-label={person.name}
      className="inline-flex items-center justify-center rounded-full font-sans"
      style={{
        width: size,
        height: size,
        background: `${person.color}1A`,
        color: person.color,
        border: `1px solid ${person.color}55`,
        fontSize: Math.round(size * 0.42)
      }}
    >
      {person.initials}
    </span>
  );
}

// ─── Freshness dot ─────────────────────────────────────────────────────────

const FRESH_COLOR: Record<Freshness, string> = {
  fresh: "#34C28A",
  "stale-soon": "#F59340",
  stale: "#E05555"
};

const FRESH_LABEL: Record<Freshness, string> = {
  fresh: "fresh",
  "stale-soon": "stale soon",
  stale: "stale"
};

export function FreshnessDot({ value, withLabel = false }: { value: Freshness; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={FRESH_LABEL[value]}>
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: FRESH_COLOR[value] }}
        aria-label={FRESH_LABEL[value]}
      />
      {withLabel ? (
        <span className="font-mono text-[10px]" style={{ color: FRESH_COLOR[value] }}>
          {FRESH_LABEL[value]}
        </span>
      ) : null}
    </span>
  );
}

// ─── Source icon ───────────────────────────────────────────────────────────

export function SourceIcon({ source, className = "h-3.5 w-3.5" }: { source: DocSource; className?: string }) {
  const props = { className, strokeWidth: 1.5 } as const;
  if (source === "drive") return <TbBrandGoogleDrive {...props} />;
  if (source === "slack") return <TbBrandSlack {...props} />;
  if (source === "notion") return <TbBrandNotion {...props} />;
  if (source === "github") return <TbBrandGithub {...props} />;
  if (source === "loom") return <TbBrandZoom {...props} />;
  if (source === "url") return <TbLink {...props} />;
  return <TbFile {...props} />;
}

// ─── Type icon ─────────────────────────────────────────────────────────────

export function TypeIcon({ type, className = "h-4 w-4" }: { type: DocType; className?: string }) {
  const props = { className, strokeWidth: 1.5 } as const;
  if (type === "pdf") return <TbFileTypePdf {...props} />;
  if (type === "docx") return <TbFileTypeDocx {...props} />;
  if (type === "md") return <TbFileText {...props} />;
  if (type === "txt") return <TbFileText {...props} />;
  if (type === "code") return <TbCode {...props} />;
  if (type === "image") return <TbPhoto {...props} />;
  if (type === "audio") return <TbFileMusic {...props} />;
  if (type === "video") return <TbVideo {...props} />;
  return <TbFile {...props} />;
}

// ─── Access badge ──────────────────────────────────────────────────────────

const ACCESS_STYLE: Record<AccessLevel, { fg: string; bg: string; border: string; label: string }> = {
  "public-team":     { fg: TEAL,   bg: `${TEAL}14`,   border: `${TEAL}55`,   label: "team"     },
  "project-only":    { fg: PURPLE, bg: `${PURPLE}14`, border: `${PURPLE}55`, label: "project"  },
  "role-restricted": { fg: ORANGE, bg: `${ORANGE}14`, border: `${ORANGE}55`, label: "role"     },
  private:           { fg: MUTED,  bg: "#F1ECE4",     border: HAIR,          label: "private"  },
  "human-only":      { fg: RUST,   bg: `${RUST}14`,   border: `${RUST}55`,   label: "no-agent" }
};

export function AccessBadge({ value }: { value: AccessLevel }) {
  const s = ACCESS_STYLE[value];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px]"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
      title={value}
    >
      <TbLock className="h-2.5 w-2.5" strokeWidth={1.5} />
      {s.label}
    </span>
  );
}

// ─── Filter chip ───────────────────────────────────────────────────────────

export function FilterChip({
  label,
  active,
  count,
  onClick,
  accent
}: {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  accent?: string;
}) {
  const a = accent ?? RUST;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] transition-colors"
      style={{
        background: active ? `${a}14` : "transparent",
        color: active ? a : MUTED,
        borderColor: active ? `${a}55` : HAIR
      }}
    >
      {label}
      {count !== undefined ? (
        <span
          className="rounded-full px-1.5 font-mono text-[10px]"
          style={{ background: active ? `${a}22` : "#F1ECE4", color: active ? a : MUTED }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

// ─── Doc row (list view) ───────────────────────────────────────────────────

export function DocRow({
  doc,
  onActionMenu,
  isNew
}: {
  doc: BrainDoc;
  onActionMenu?: (id: string) => void;
  isNew?: boolean;
}) {
  const uploader = personById(doc.uploaderId);
  return (
    <article
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-start gap-4 border-b px-4 py-3 transition-colors hover:bg-[#FBF7F1]"
      style={{ borderColor: HAIR, animation: isNew ? "brain-pulse 1.6s ease-out 1" : undefined }}
    >
      <div className="pt-0.5">
        <TypeIcon type={doc.type} className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <Link
            to={`/company-brain/documents/${doc.id}`}
            className="truncate font-sans text-[14px] hover:underline"
            style={{ color: INK }}
          >
            {doc.title}
          </Link>
          {doc.isSourceOfTruth ? (
            <span
              className="rounded-full border px-1.5 py-0.5 font-mono text-[9px]"
              style={{ color: TEAL, borderColor: `${TEAL}55`, background: `${TEAL}14` }}
            >
              source of truth · {doc.isSourceOfTruth}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 font-sans text-[12px] leading-5" style={{ color: MUTED }}>
          {doc.summary}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
          {doc.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-[4px] bg-[#F1ECE4] px-1.5 py-0.5">
              #{t}
            </span>
          ))}
          {doc.expiresAt ? (
            <span className="rounded-[4px] px-1.5 py-0.5" style={{ background: `${RUST}10`, color: RUST }}>
              {doc.expiresAt}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SourceIcon source={doc.source} />
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          {doc.source}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PersonDisc person={uploader} size={20} />
        <div className="text-right">
          <p className="font-sans text-[12px] leading-tight" style={{ color: INK }}>
            {uploader?.name}
          </p>
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            {doc.uploadedAt}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AccessBadge value={doc.access} />
        <FreshnessDot value={doc.freshness} />
        <button
          type="button"
          onClick={() => onActionMenu?.(doc.id)}
          className="rounded-[6px] border px-1.5 py-0.5 font-mono text-[10px] opacity-0 transition-opacity hover:bg-[#FAF8F5] group-hover:opacity-100"
          style={{ borderColor: HAIR, color: MUTED }}
        >
          ⋯
        </button>
      </div>
    </article>
  );
}

// ─── Doc card (grid view) ──────────────────────────────────────────────────

export function DocCard({ doc, isNew }: { doc: BrainDoc; isNew?: boolean }) {
  const uploader = personById(doc.uploaderId);
  return (
    <Link
      to={`/company-brain/documents/${doc.id}`}
      className="block rounded-[8px] border bg-white p-4 transition-colors hover:border-[color:rgba(26,22,18,0.16)]"
      style={{ borderColor: HAIR, animation: isNew ? "brain-pulse 1.6s ease-out 1" : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <TypeIcon type={doc.type} className="h-5 w-5" />
        <AccessBadge value={doc.access} />
      </div>
      <p className="mt-3 font-sans text-[14px] leading-snug" style={{ color: INK }}>
        {doc.title}
      </p>
      <p className="mt-1 line-clamp-3 font-sans text-[12px] leading-5" style={{ color: MUTED }}>
        {doc.summary}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[10px]" style={{ color: MUTED }}>
        {doc.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-[4px] bg-[#F1ECE4] px-1.5 py-0.5">
            #{t}
          </span>
        ))}
      </div>
      <div
        className="mt-3 flex items-center justify-between gap-2 border-t pt-2 font-mono text-[10px]"
        style={{ borderColor: HAIR, color: MUTED }}
      >
        <div className="flex items-center gap-1.5">
          <PersonDisc person={uploader} size={16} />
          <span>{uploader?.name}</span>
          <span>·</span>
          <span>{doc.uploadedAt}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceIcon source={doc.source} />
          <FreshnessDot value={doc.freshness} />
        </div>
      </div>
    </Link>
  );
}

// ─── Result card (search) ──────────────────────────────────────────────────

export function ResultActions({ docId }: { docId: string }) {
  return (
    <div className="flex items-center gap-1">
      <ActionIconBtn label="copy citation"><TbCopy className="h-3.5 w-3.5" strokeWidth={1.5} /></ActionIconBtn>
      <ActionIconBtn label="add to pack"><TbPlus className="h-3.5 w-3.5" strokeWidth={1.5} /></ActionIconBtn>
      <ActionIconBtn label="flag outdated"><TbFlag2 className="h-3.5 w-3.5" strokeWidth={1.5} /></ActionIconBtn>
      <ActionIconBtn label="share"><TbShare3 className="h-3.5 w-3.5" strokeWidth={1.5} /></ActionIconBtn>
      <Link
        to={`/company-brain/documents/${docId}`}
        className="rounded-[6px] border px-2 py-1 font-sans text-[11px] hover:bg-[#FAF8F5]"
        style={{ borderColor: HAIR, color: INK }}
      >
        open
      </Link>
    </div>
  );
}

function ActionIconBtn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="rounded-[6px] p-1.5 hover:bg-[#FAF8F5]"
      style={{ color: MUTED }}
    >
      {children}
    </button>
  );
}

// ─── Card frame ────────────────────────────────────────────────────────────

export function Card({
  title,
  subtitle,
  actions,
  onDismiss,
  onRefresh,
  children
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
  onRefresh?: () => void;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[8px] border bg-white"
      style={{ borderColor: HAIR }}
    >
      <header
        className="flex items-start justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: HAIR }}
      >
        <div className="min-w-0">
          <h3 className="font-sans text-[14px]" style={{ color: INK }}>
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 font-sans text-[12px]" style={{ color: MUTED }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: MUTED }}>
          {actions}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-[4px] px-1.5 py-0.5 hover:bg-[#FAF8F5]"
              title="refresh"
            >
              ↻
            </button>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-[4px] px-1.5 py-0.5 hover:bg-[#FAF8F5]"
              title="dismiss"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

// ─── Mini doc reference (used by cards) ────────────────────────────────────

export function DocMiniRef({ docId }: { docId: string }) {
  const d = docById(docId);
  if (!d) return null;
  return (
    <Link
      to={`/company-brain/documents/${d.id}`}
      className="flex items-center gap-1.5 hover:underline"
      style={{ color: INK }}
    >
      <TypeIcon type={d.type} className="h-3.5 w-3.5" />
      <span className="truncate font-sans text-[12px]">{d.title}</span>
    </Link>
  );
}
