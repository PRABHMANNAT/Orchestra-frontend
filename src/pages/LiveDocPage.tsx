import mermaid from "mermaid";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useParams } from "react-router-dom";
import { AlertCircleIcon, ArrowRightIcon, CheckIcon, CloseIcon, RefreshIcon } from "../components/ui/AppIcons";
import { getLiveDoc } from "../lib/api";
import type { LiveDocExport, LiveDocPayload, LiveDocSection } from "../lib/types";

type UpdateMode = "auto" | "confirm";
type ExportId = LiveDocExport["id"];
type SectionKind = "sourced" | "authored";
type EditableSection = LiveDocSection & {
  kind: SectionKind;
  sourceOfferId?: string;
};
type ProposedEdit = {
  id: string;
  title: string;
  content: string;
  reason: string;
  contradiction?: boolean;
};

const sectionListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
} as const;

const sectionItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] as const }
  })
};

function formatNow() {
  return new Date().toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function fileNameForExport(item: LiveDocExport) {
  if (item.id === "agent") {
    return "agent-context.md";
  }

  if (item.id === "payments") {
    return "payments.md";
  }

  if (item.id === "diagram") {
    return "billing-context.mmd";
  }

  return `${item.id}.md`;
}

function toEditableSections(payload: LiveDocPayload): EditableSection[] {
  const sections: EditableSection[] = payload.sections.map((section) => ({
    ...section,
    kind: section.sourceIds.length > 0 ? "sourced" as const : "authored" as const
  }));

  const insertAt = Math.max(
    sections.findIndex((section) => section.id === "sec-payments") + 1,
    0
  );

  sections.splice(insertAt, 0, {
    id: "sec-rate-limit-authored",
    anchorId: "rate-limit-authored",
    sectionLabel: "",
    type: "body",
    content: "Rate limits should protect ingestion from noisy SDK clients without blocking invoice preview.",
    sourceIds: [],
    exportTags: ["agent", "backend"],
    kind: "authored",
    sourceOfferId: "c10"
  });

  return sections;
}

function createAuthoredSection(): EditableSection {
  const id = `sec-authored-${Date.now()}`;

  return {
    id,
    anchorId: id,
    sectionLabel: "",
    type: "body",
    content: "New authored context...",
    sourceIds: [],
    exportTags: ["agent"],
    kind: "authored"
  };
}

function createSocratesRateLimitSection(): EditableSection {
  return {
    id: `sec-socrates-rate-limit-${Date.now()}`,
    anchorId: "rate-limiting",
    sectionLabel: "",
    type: "body",
    content: "Rate limiting should apply at ingestion per workspace and SDK key, with replay jobs exempted through a signed internal queue path.",
    sourceIds: [],
    exportTags: ["agent", "backend"],
    kind: "authored",
    sourceOfferId: "c10"
  };
}

function MermaidDiagram({ chart, id, height = 180 }: { chart: string; id: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(`context-diagram-${id}-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    let cancelled = false;

    const render = async () => {
      if (!ref.current) {
        return;
      }

      ref.current.innerHTML = "";

      try {
        const { svg, bindFunctions } = await mermaid.render(renderIdRef.current, chart);
        if (!ref.current || cancelled) {
          return;
        }

        ref.current.innerHTML = svg;
        bindFunctions?.(ref.current);
      } catch (error) {
        if (ref.current && !cancelled) {
          ref.current.innerHTML =
            '<div class="flex min-h-[180px] items-center justify-center font-mono text-[12px] text-[#78716C]">Unable to render diagram.</div>';
        }

        console.error("Mermaid render failed", error);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return <div ref={ref} className="w-full overflow-x-auto [&_svg]:h-auto [&_svg]:w-full" style={{ minHeight: height }} />;
}

function renderHighlightedContent({
  section,
  value,
  tooltipSource,
  onHighlightClick
}: {
  section: LiveDocSection;
  value: string;
  tooltipSource: string | null;
  onHighlightClick: (event: ReactMouseEvent<HTMLSpanElement>) => void;
}) {
  if (!section.highlight) {
    return value;
  }

  const fallbackStart = value.indexOf(section.highlight.text);
  const start = value.slice(section.highlight.start, section.highlight.end) === section.highlight.text ? section.highlight.start : fallbackStart;

  if (start === -1) {
    return value;
  }

  const end = start + section.highlight.text.length;

  return (
    <>
      {value.slice(0, start)}
      <span
        data-source-control="true"
        onClick={onHighlightClick}
        className="relative inline-block cursor-pointer rounded-[3px] bg-[#fff9c4] px-[2px] py-[1px] transition-colors hover:bg-[#fff3a0]"
      >
        {value.slice(start, end)}

        <AnimatePresence>
          {tooltipSource ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-max max-w-[320px] -translate-x-1/2 rounded-lg bg-[#1A1612] px-[10px] py-[6px] text-center font-sans text-[11px] text-white"
            >
              SOURCE: {tooltipSource}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
      {value.slice(end)}
    </>
  );
}

function ModeToggle({ mode, onChange }: { mode: UpdateMode; onChange: (mode: UpdateMode) => void }) {
  return (
    <div className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-1">
      {(["auto", "confirm"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={[
            "rounded-xl px-3 py-2 font-sans text-[12px] capitalize transition-colors",
            mode === item ? "bg-[#B8543D] text-white" : "text-[#5A5450] hover:bg-[#FAF8F5]"
          ].join(" ")}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SourcesRail({ payload, activeSectionId, onClose }: { payload: LiveDocPayload; activeSectionId: string | null; onClose: () => void }) {
  const activeSection = payload.sections.find((section) => section.id === activeSectionId) ?? null;
  const source =
    payload.comments.find((comment) => comment.linkedSectionId === activeSectionId || comment.id === activeSectionId || activeSection?.sourceIds.includes(comment.id)) ?? null;

  if (!source) {
    return null;
  }

  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-[340px] flex-shrink-0 overflow-y-auto border-l border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-5 py-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-sans text-[11px] tracking-[0.18em] text-[rgba(120,113,108,0.6)]">SOURCES</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(26,22,18,0.08)] bg-white text-[#78716C] transition-colors hover:text-[#B8543D]"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-[13px] font-medium text-[#1A1612]">{source.authorName}</p>
                <p className="mt-1 font-mono text-[10px] text-[#78716C]">
                  {source.time} · {source.date}
                </p>
              </div>
              <span className="rounded-full bg-[#FAF8F5] px-2 py-[2px] font-mono text-[10px] text-[#78716C]">SOURCE</span>
            </div>
            <p className="mt-3 font-sans text-[13px] leading-6 text-[#1A1612]">{source.content}</p>
            <p className="mt-3 font-mono text-[10px] italic text-[#78716C]">{source.source}</p>
          </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}

function SourceChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-source-control="true"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2 py-[2px] font-mono text-[10px] text-[#5A5450] transition-colors hover:border-[#B8543D] hover:text-[#B8543D]"
    >
      Source
      <ArrowRightIcon className="h-3 w-3" />
    </button>
  );
}

function DesignSystemSection({ payload, onSourceClick }: { payload: LiveDocPayload; onSourceClick: (section: LiveDocSection) => void }) {
  const section = payload.sections.find((item) => item.id === payload.designSystem.sourceSectionId);

  if (!section) {
    return null;
  }

  return (
    <motion.div variants={sectionItemVariants} className="mb-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {payload.designSystem.palette.map((item) => (
          <div key={item.token} className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-3">
            <p className="mb-2 font-sans text-[11px] text-[#5A5450]">{item.label}</p>
            <div className="h-24 rounded-[12px] border border-[rgba(26,22,18,0.08)]" style={{ backgroundColor: item.hex }} />
            <p className="mt-2 font-mono text-[11px] text-[#1A1612]">{item.hex}</p>
            <p className="mt-1 font-mono text-[9px] text-[#78716C]">{item.token}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[12px] tracking-[0.14em] text-[#1A1612]">{payload.designSystem.font.family}</p>
              <p className="mt-1 font-mono text-[10px] text-[#78716C]">{payload.designSystem.font.monoFamily} for metadata</p>
            </div>
            <SourceChip onClick={() => onSourceClick(section)} />
          </div>
          <p className="mt-4 text-[20px] leading-8 text-[#1A1612]" style={{ fontFamily: `${payload.designSystem.font.family}, sans-serif` }}>
            {payload.designSystem.font.sample}
          </p>
          <p className="mt-3 font-mono text-[10px] text-[#78716C]">{payload.designSystem.font.meta}</p>
        </div>

        <div className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-4">
          <p className="mb-3 font-sans text-[12px] tracking-[0.14em] text-[#1A1612]">Tokens</p>
          <div className="flex flex-wrap gap-2">
            {payload.designSystem.tokens.map((item) => (
              <span key={item.label} className="rounded-full border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-3 py-1 font-mono text-[10px] text-[#5A5450]">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EditableSectionBlock({
  section,
  tooltipSource,
  onSourceClick,
  onSectionChange
}: {
  section: EditableSection;
  tooltipSource: string | null;
  onSourceClick: (section: LiveDocSection) => void;
  onSectionChange: (sectionId: string, value: string) => void;
}) {
  const editableRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (editableRef.current && editableRef.current.textContent !== section.content) {
      editableRef.current.textContent = section.content;
    }
  }, [section.content]);

  const handleBlur = () => {
    const nextValue = editableRef.current?.textContent?.trim() ?? "";
    if (nextValue && nextValue !== section.content) {
      onSectionChange(section.id, nextValue);
    }
  };

  if (section.kind === "sourced" && section.type === "highlighted") {
    return (
      <p
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        className="font-sans text-[16px] leading-[1.9] text-[#1A1612] outline-none"
      >
        {renderHighlightedContent({
          section,
          value: section.content,
          tooltipSource,
          onHighlightClick: (event) => {
            event.stopPropagation();
            onSourceClick(section);
          }
        })}
      </p>
    );
  }

  return (
    <p
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className="font-sans text-[16px] leading-[1.9] text-[#1A1612] outline-none"
    >
      {section.content}
    </p>
  );
}

function ContradictionDiff({
  payload,
  onAccept,
  onDismiss
}: {
  payload: LiveDocPayload;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="absolute left-6 right-6 top-16 z-40 rounded-2xl border border-[#B8543D] bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[#B8543D]">
          <AlertCircleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-sans text-[12px] tracking-[0.16em] text-[#B8543D]">NEEDS REVIEW</p>
            <span className="rounded-full bg-[rgba(184,84,61,0.10)] px-2 py-[2px] font-mono text-[10px] text-[#B8543D]">
              contradicts prior decision
            </span>
          </div>
          <p className="mt-2 font-sans text-[13px] leading-6 text-[#5A5450]">{payload.contradictionDiff.reason}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] p-3">
          <p className="font-mono text-[10px] text-[#78716C]">Accepted decision</p>
          <p className="mt-2 font-sans text-[13px] leading-6 text-[#1A1612]">{payload.contradictionDiff.existingDecision}</p>
        </div>
        <div className="rounded-xl border border-[rgba(26,22,18,0.08)] bg-white p-3">
          <p className="font-mono text-[10px] text-[#78716C]">Incoming source claim</p>
          <p className="mt-2 font-sans text-[13px] leading-6 text-[#1A1612]">{payload.contradictionDiff.incomingClaim}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-[#78716C]">
          {payload.contradictionDiff.source} · {payload.contradictionDiff.timestamp}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onDismiss} className="rounded-xl border border-[rgba(26,22,18,0.08)] px-4 py-2 font-sans text-[12px] text-[#5A5450]">
            Dismiss
          </button>
          <button type="button" onClick={onAccept} className="rounded-xl bg-[#1A1612] px-4 py-2 font-sans text-[12px] text-white transition-colors hover:bg-[#B8543D]">
            Accept change
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ExportCanvas({ item, copied, onCopy, onClose }: { item: LiveDocExport; copied: boolean; onCopy: () => void; onClose: () => void }) {
  const isDiagram = item.id === "diagram";

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto min-h-full max-w-[1040px] px-10 py-10 xl:px-16"
    >
      <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white px-4 py-3">
        <div>
          <p className="font-mono text-[12px] text-[#1A1612]">{fileNameForExport(item)}</p>
          <p className="mt-1 font-mono text-[10px] text-[#78716C]">{item.lens}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopy} className="rounded-lg bg-[#1A1612] px-3 py-1.5 font-sans text-[11px] text-white transition-colors hover:bg-[#B8543D]">
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(26,22,18,0.08)] bg-white text-[#78716C] transition-colors hover:text-[#B8543D]">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ backgroundPosition: "200% 0" }}
        animate={{ backgroundPosition: "-200% 0" }}
        transition={{ duration: 0.9, ease: "linear" }}
        className="rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-6"
      >
        {isDiagram ? (
          <MermaidDiagram chart={item.preview} id={`export-${item.id}`} height={320} />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-[#1A1612]">{item.preview}</pre>
        )}
      </motion.div>
    </motion.div>
  );
}

function SocratesProposal({
  proposal,
  onAccept,
  onDismiss
}: {
  proposal: ProposedEdit;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="absolute left-6 right-6 top-16 z-40 rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[12px] tracking-[0.16em] text-[#1A1612]">{proposal.contradiction ? "NEEDS REVIEW" : "SOCRATES PROPOSED EDIT"}</p>
          <p className="mt-2 font-sans text-[13px] leading-6 text-[#5A5450]">{proposal.reason}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onDismiss} className="rounded-xl border border-[rgba(26,22,18,0.08)] px-4 py-2 font-sans text-[12px] text-[#5A5450]">
            Dismiss
          </button>
          <button type="button" onClick={onAccept} className="rounded-xl bg-[#1A1612] px-4 py-2 font-sans text-[12px] text-white transition-colors hover:bg-[#B8543D]">
            Accept
          </button>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] p-3">
        <p className="font-mono text-[10px] text-[#78716C]">{proposal.title}</p>
        <p className="mt-2 font-sans text-[13px] leading-6 text-[#1A1612]">{proposal.content}</p>
      </div>
    </motion.div>
  );
}

function LiveDocCanvas({
  payload,
  sections,
  updatedSectionId,
  activeSourceSectionId,
  tooltipSectionId,
  onSourceClick,
  onSectionChange,
  onAddSection,
  onDeleteSection,
  onBackfillSource
}: {
  payload: LiveDocPayload;
  sections: EditableSection[];
  updatedSectionId: string | null;
  activeSourceSectionId: string | null;
  tooltipSectionId: string | null;
  onSourceClick: (section: LiveDocSection) => void;
  onSectionChange: (sectionId: string, value: string) => void;
  onAddSection: () => void;
  onDeleteSection: (sectionId: string) => void;
  onBackfillSource: (sectionId: string) => void;
}) {
  const diagram = useMemo(() => payload.exports.find((item) => item.id === "diagram")?.preview ?? "", [payload]);

  return (
    <motion.div
      key="doc"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto min-h-full max-w-[1040px] px-10 py-10 xl:px-16"
    >
      <div className="mb-12">
        <p className="font-mono text-[12px] text-[#78716C]">{payload.version}</p>
        <h2 className="mt-3 max-w-[760px] font-sans text-[40px] leading-none text-[#1A1612]">{payload.sections[0]?.content}</h2>
      </div>

      <motion.div variants={sectionListVariants} initial="hidden" animate="visible">
        {sections.slice(1).map((section, index) => {
          const source = payload.comments.find((comment) => comment.id === section.sourceIds[0]);
          const tooltipSource = tooltipSectionId === section.id ? source?.source ?? null : null;
          const isUpdated = updatedSectionId === section.id;
          const hasSource = section.sourceIds.length > 0;

          if (section.type === "section-heading") {
            if (section.anchorId === "diagrams") {
              return (
                <motion.div key={section.id} custom={index} variants={sectionItemVariants} className="mt-16">
                  <p className="mb-5 font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-[#1A1612]">{section.sectionLabel}</p>
                  <div className="overflow-hidden rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white">
                    <div className="flex items-center justify-between border-b border-[#FAF8F5] px-5 py-3">
                      <p className="font-sans text-[12px] tracking-[0.14em] text-[#1A1612]">Billing context flow</p>
                      <p className="font-mono text-[10px] text-[#78716C]">Diagram export</p>
                    </div>
                    <div className="px-5 py-5">
                      <MermaidDiagram chart={diagram} id="inline-diagram" />
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div key={section.id} custom={index} variants={sectionItemVariants} className="mb-5 mt-16">
                <p className="font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-[#1A1612]">{section.sectionLabel}</p>
              </motion.div>
            );
          }

          return (
            <motion.div key={section.id} custom={index} variants={sectionItemVariants} className="group relative mb-8">
              {section.id === payload.designSystem.sourceSectionId ? (
                <DesignSystemSection payload={payload} onSourceClick={onSourceClick} />
              ) : (
              <motion.div
                animate={
                  isUpdated
                    ? { backgroundColor: ["rgba(184,84,61,0)", "rgba(184,84,61,0.15)", "rgba(184,84,61,0.04)"] }
                    : { backgroundColor: "rgba(255,255,255,0)" }
                }
                transition={{ duration: isUpdated ? 1.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderLeft: isUpdated || activeSourceSectionId === section.id ? "3px solid #B8543D" : "3px solid transparent",
                  paddingLeft: isUpdated || activeSourceSectionId === section.id ? 16 : 0,
                  paddingRight: 16,
                  borderRadius: isUpdated || activeSourceSectionId === section.id ? "0 8px 8px 0" : 0
                }}
              >
                <EditableSectionBlock
                  section={section}
                  tooltipSource={tooltipSource}
                  onSourceClick={onSourceClick}
                  onSectionChange={onSectionChange}
                />

                      <div className="mt-2 flex flex-wrap gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                        {section.exportTags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2 py-[2px] font-mono text-[10px] text-[#78716C]">
                      {tag}
                    </span>
                  ))}

                        {hasSource ? (
                    <SourceChip onClick={() => onSourceClick(section)} />
                  ) : null}
                        {section.kind === "authored" ? (
                          <span className="rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2 py-[2px] font-mono text-[10px] text-[#78716C]">authored</span>
                        ) : null}
                        {section.sourceOfferId ? (
                          <button
                            type="button"
                            onClick={() => onBackfillSource(section.id)}
                            className="rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2 py-[2px] font-mono text-[10px] text-[#5A5450] transition-colors hover:border-[#B8543D] hover:text-[#B8543D]"
                          >
                            link source?
                          </button>
                        ) : null}
                        {section.kind === "authored" ? (
                          <button
                            type="button"
                            onClick={() => onDeleteSection(section.id)}
                            className="rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2 py-[2px] font-mono text-[10px] text-[#78716C] transition-colors hover:text-[#B8543D]"
                          >
                            delete
                          </button>
                        ) : null}
                </div>
              </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
      <button
        type="button"
        onClick={onAddSection}
        className="mt-8 rounded-xl border border-[rgba(26,22,18,0.08)] bg-white px-4 py-2 font-sans text-[13px] text-[#5A5450] transition-colors hover:text-[#B8543D]"
      >
        Add section
      </button>
    </motion.div>
  );
}

export function LiveDocPage() {
  const { id = "1" } = useParams();
  const [payload, setPayload] = useState<LiveDocPayload | null>(null);
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [activeSourceSectionId, setActiveSourceSectionId] = useState<string | null>(null);
  const [tooltipSectionId, setTooltipSectionId] = useState<string | null>(null);
  const [mode, setMode] = useState<UpdateMode>("auto");
  const [updatedSectionId, setUpdatedSectionId] = useState<string | null>(null);
  const [toastAt, setToastAt] = useState<string | null>(null);
  const [showContradiction, setShowContradiction] = useState(false);
  const [activeExportId, setActiveExportId] = useState<ExportId | null>(null);
  const [copiedExportId, setCopiedExportId] = useState<ExportId | null>(null);
  const [proposedEdit, setProposedEdit] = useState<ProposedEdit | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      flowchart: { useMaxWidth: true, htmlLabels: true },
      themeVariables: {
        primaryColor: "#E9EFEC",
        primaryTextColor: "#1A1612",
        primaryBorderColor: "#B8543D",
        lineColor: "#B8543D",
        secondaryColor: "#EFEEEC",
        tertiaryColor: "#F3E8D9",
        background: "#ffffff",
        mainBkg: "#E9EFEC",
        nodeBorder: "#B8543D",
        clusterBkg: "#FAF8F5",
        titleColor: "#1A1612",
        edgeLabelBackground: "#ffffff",
        fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace",
        fontSize: "13px"
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextPayload = await getLiveDoc(id);
      if (!cancelled) {
        setPayload(nextPayload);
        setSections(toEditableSections(nextPayload));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const handleExport = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: ExportId }>).detail;
      const exportId = detail?.id;

      if (exportId) {
        setActiveExportId(exportId);
        setCopiedExportId(null);
      }
    };

    window.addEventListener("live-doc-export", handleExport);
    return () => window.removeEventListener("live-doc-export", handleExport);
  }, []);

  useEffect(() => {
    const handleSocratesWrite = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      const prompt = detail?.prompt?.toLowerCase() ?? "";
      const contradiction = prompt.includes("contradict") || prompt.includes("stripe direct") || prompt.includes("direct stripe");
      const nextEdit: ProposedEdit = contradiction
        ? {
            id: `proposal-${Date.now()}`,
            title: "Proposed conflicting edit",
            content: "Invoice preview may call Stripe directly during beta when ledger reconciliation is delayed.",
            reason: "Contradicts the accepted BillingPort boundary, so it requires confirm.",
            contradiction: true
          }
        : {
            id: `proposal-${Date.now()}`,
            title: "Rate limiting",
            content: createSocratesRateLimitSection().content,
            reason: "Socrates drafted this as authored context without a confirmed source.",
            contradiction: false
          };

      if (mode === "auto" && !nextEdit.contradiction) {
        setSections((current) => [...current, { ...createSocratesRateLimitSection(), content: nextEdit.content }]);
        return;
      }

      setProposedEdit(nextEdit);
    };

    window.addEventListener("live-doc-socrates-write", handleSocratesWrite);
    return () => window.removeEventListener("live-doc-socrates-write", handleSocratesWrite);
  }, [mode]);

  useEffect(() => {
    const handleSourceChange = (event: Event) => {
      if (!payload) {
        return;
      }

      const detail = (event as CustomEvent<{ kind?: "normal" | "contradiction" }>).detail;

      if (detail?.kind === "contradiction") {
        setShowContradiction(true);
        return;
      }

      setUpdatedSectionId(payload.updateEvent.targetSectionId);
      setToastAt(formatNow());
      window.setTimeout(() => setUpdatedSectionId(null), 1800);
      window.setTimeout(() => setToastAt(null), 3200);
    };

    window.addEventListener("live-doc-source-change", handleSourceChange);
    return () => window.removeEventListener("live-doc-source-change", handleSourceChange);
  }, [payload]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-source-control="true"]')) {
        setTooltipSectionId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!payload) {
    return <section className="h-full bg-bg" />;
  }

  const activeExport = activeExportId ? payload.exports.find((item) => item.id === activeExportId) ?? null : null;

  const handleSourceClick = (section: LiveDocSection) => {
    setActiveSourceSectionId((current) => (current === section.id ? null : section.id));
    setTooltipSectionId(section.id);
  };

  const handleSectionChange = (sectionId: string, value: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        if (section.kind === "sourced" && value !== section.content) {
          return {
            ...section,
            content: value,
            kind: "authored",
            sourceIds: [],
            highlight: undefined,
            type: "body"
          };
        }

        return { ...section, content: value };
      })
    );
    setActiveSourceSectionId((current) => (current === sectionId ? null : current));
  };

  const handleAddSection = () => {
    setSections((current) => [...current, createAuthoredSection()]);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((current) => current.filter((section) => section.id !== sectionId));
    setActiveSourceSectionId((current) => (current === sectionId ? null : current));
  };

  const handleBackfillSource = (sectionId: string) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || !section.sourceOfferId) {
          return section;
        }

        const highlightText = section.content.includes("Rate limits") ? "Rate limits" : section.content.split(" ").slice(0, 3).join(" ");
        const start = section.content.indexOf(highlightText);

        return {
          ...section,
          kind: "sourced",
          type: "highlighted",
          sourceIds: [section.sourceOfferId],
          sourceOfferId: undefined,
          highlight: {
            text: highlightText,
            start: Math.max(start, 0),
            end: Math.max(start, 0) + highlightText.length
          }
        };
      })
    );
    setActiveSourceSectionId(sectionId);
  };

  const acceptProposedEdit = () => {
    if (!proposedEdit) {
      return;
    }

    setSections((current) => [
      ...current,
      {
        ...createSocratesRateLimitSection(),
        id: `sec-socrates-${Date.now()}`,
        content: proposedEdit.content,
        sourceOfferId: proposedEdit.contradiction ? undefined : "c10"
      }
    ]);
    setProposedEdit(null);
  };

  const handleCopyExport = async (item: LiveDocExport) => {
    try {
      await navigator.clipboard?.writeText(item.preview);
    } catch {
      // Clipboard can be unavailable in local preview.
    }

    setCopiedExportId(item.id);
    window.setTimeout(() => setCopiedExportId(null), 1400);
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-bg">
      <div className="flex h-12 shrink-0 items-center justify-between border-b-[1.5px] border-[rgba(26,22,18,0.08)] bg-bg px-6">
        <h1 className="font-sans text-[15px] font-medium text-[#1A1612]">{payload.projectName} · Context</h1>
        <div className="flex items-center gap-3">
          <p className="hidden font-sans text-[12px] text-[#78716C] lg:block">Contradictions always require confirm, even in Auto.</p>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      <AnimatePresence>
        {showContradiction ? (
          <ContradictionDiff payload={payload} onAccept={() => setShowContradiction(false)} onDismiss={() => setShowContradiction(false)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {proposedEdit ? (
          <SocratesProposal proposal={proposedEdit} onAccept={acceptProposedEdit} onDismiss={() => setProposedEdit(null)} />
        ) : null}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="min-w-0 flex-1 overflow-y-auto bg-bg">
          <AnimatePresence mode="wait">
            {activeExport ? (
              <ExportCanvas
                key={activeExport.id}
                item={activeExport}
                copied={copiedExportId === activeExport.id}
                onCopy={() => void handleCopyExport(activeExport)}
                onClose={() => {
                  setActiveExportId(null);
                  setCopiedExportId(null);
                }}
              />
            ) : (
              <LiveDocCanvas
                key="doc"
                payload={payload}
                sections={sections}
                updatedSectionId={updatedSectionId}
                activeSourceSectionId={activeSourceSectionId}
                tooltipSectionId={tooltipSectionId}
                onSourceClick={handleSourceClick}
                onSectionChange={handleSectionChange}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                onBackfillSource={handleBackfillSource}
              />
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {activeSourceSectionId ? <SourcesRail payload={payload} activeSectionId={activeSourceSectionId} onClose={() => setActiveSourceSectionId(null)} /> : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toastAt ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-[360px] z-50 flex items-center gap-3 rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white px-5 py-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(184,84,61,0.10)] text-[#B8543D]">
              <CheckIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-sans text-[13px] text-[#1A1612]">Source changed · doc updated · exports regenerated</p>
              <p className="font-mono text-[10px] text-[#78716C]">{toastAt}</p>
            </div>
            <RefreshIcon className="h-4 w-4 text-[#78716C]" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
