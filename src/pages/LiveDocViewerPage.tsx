import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, CloseIcon, FileTextIcon } from "../components/ui/AppIcons";
import { getAnchorProvenance, getDocViewer, getProjects } from "../lib/api";
import type { AnchorProvenance, DocSection, DocViewerPayload } from "../lib/types";

type SectionDrafts = Record<string, string>;

const citedAnchorIds = ["driver-detail"];

const sectionStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03
    }
  }
} as const;

const sectionItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
} as const;

function platformBadge(platform: AnchorProvenance["linkedMessages"][number]["platform"]) {
  if (platform === "slack") {
    return {
      bg: "rgba(120,113,108,0.10)",
      text: "#5A5450",
      label: "S"
    };
  }

  if (platform === "email") {
    return {
      bg: "rgba(120,113,108,0.10)",
      text: "#5A5450",
      label: "G"
    };
  }

  return {
    bg: "rgba(120,113,108,0.10)",
    text: "#5A5450",
    label: "W"
  };
}

function renderHeadingLevel(level: number | undefined) {
  if (level === 1) {
    return "font-sans text-[32px] leading-none text-[#1A1612] mt-10 mb-4";
  }

  return "font-sans text-[22px] leading-none text-[#1A1612] mt-8 mb-3";
}

function applyDrafts(viewer: DocViewerPayload, drafts: SectionDrafts): DocViewerPayload {
  return {
    ...viewer,
    sections: viewer.sections.map((section) => {
      const nextContent = drafts[section.id];
      if (nextContent === undefined) {
        return section;
      }

      return {
        ...section,
        content: nextContent
      };
    })
  };
}

function sectionValue(section: DocSection, drafts: SectionDrafts) {
  return drafts[section.id] ?? section.content;
}

export function LiveDocViewerPage() {
  const navigate = useNavigate();
  const { id = "1", docId = "1" } = useParams();
  const provenanceRequestRef = useRef(0);

  const [projectName, setProjectName] = useState("PROJECT");
  const [viewer, setViewer] = useState<DocViewerPayload | null>(null);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [provenance, setProvenance] = useState<AnchorProvenance | null>(null);
  const [isLoadingProvenance, setIsLoadingProvenance] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState<SectionDrafts>({});

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      const [projects, payload] = await Promise.all([getProjects(), getDocViewer(id, docId)]);
      if (isCancelled) {
        return;
      }

      const project = projects.find((item) => item.id === id) ?? projects[0];
      setProjectName(project?.name ?? "PROJECT");
      setViewer(payload);
      setSelectedAnchor(null);
      setProvenance(null);
      setEditMode(false);
      setDrafts({});
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [docId, id]);

  useEffect(() => {
    if (!selectedAnchor) {
      setProvenance(null);
      setIsLoadingProvenance(false);
      return;
    }

    const requestId = provenanceRequestRef.current + 1;
    provenanceRequestRef.current = requestId;
    setIsLoadingProvenance(true);

    const load = async () => {
      const payload = await getAnchorProvenance(id, docId, selectedAnchor);
      if (provenanceRequestRef.current !== requestId) {
        return;
      }

      setProvenance(payload);
      setIsLoadingProvenance(false);
    };

    void load();
  }, [docId, id, selectedAnchor]);

  const activeSection = useMemo(
    () => viewer?.sections.find((section) => section.anchorId === selectedAnchor) ?? null,
    [selectedAnchor, viewer]
  );

  const handleSectionChange = (sectionId: string, value: string) => {
    setDrafts((current) => ({
      ...current,
      [sectionId]: value
    }));
  };

  const handleSave = () => {
    if (!viewer) {
      return;
    }

    // TODO: PATCH /v1/projects/:projectId/documents/:documentId
    setViewer(applyDrafts(viewer, drafts));
    setEditMode(false);
  };

  const renderSection = (section: DocSection) => {
    const currentValue = sectionValue(section, drafts);
    const isCited = citedAnchorIds.includes(section.anchorId);
    const isSelected = selectedAnchor === section.anchorId;
    const isChanged = section.hasChange;

    if (section.type === "heading") {
      if (editMode) {
        return (
          <input
            value={currentValue}
            onChange={(event) => handleSectionChange(section.id, event.target.value)}
            className="w-full rounded-xl border border-[rgba(26,22,18,0.08)] bg-white px-4 py-3 font-sans text-[15px] text-[#1A1612] outline-none transition-colors focus:border-[#B8543D]"
          />
        );
      }

      return <h2 className={renderHeadingLevel(section.level)}>{currentValue}</h2>;
    }

    if (section.type === "paragraph") {
      const interactive = !editMode && isChanged;
      const baseBorder = isCited ? "#B8543D" : "#B8543D";
      const baseBackground = isCited ? "rgba(184,84,61,0.04)" : "rgba(184,84,61,0.04)";
      const hoverBackground = isCited ? "rgba(184,84,61,0.08)" : "rgba(184,84,61,0.08)";
      const highlightStyle =
        isChanged || isCited
          ? {
              borderLeft: `3px solid ${baseBorder}`,
              background: baseBackground,
              borderRadius: "0 8px 8px 0",
              paddingLeft: "16px"
            }
          : undefined;

      if (editMode) {
        return (
          <textarea
            value={currentValue}
            onChange={(event) => handleSectionChange(section.id, event.target.value)}
            className="w-full resize-y rounded-xl border border-[rgba(26,22,18,0.08)] bg-white px-4 py-3 font-sans text-[14px] leading-[1.8] text-[#1A1612] outline-none transition-colors focus:border-[#B8543D]"
            style={{ minHeight: 80 }}
          />
        );
      }

      return (
        <motion.div
          initial={isCited ? { backgroundColor: "rgba(184,84,61,0)" } : false}
          animate={isCited ? { backgroundColor: ["rgba(184,84,61,0)", "rgba(184,84,61,0.15)", "rgba(184,84,61,0.04)"] } : undefined}
          transition={isCited ? { duration: 1.2, times: [0, 0.45, 1] } : undefined}
          className={[
            "relative mb-5 transition-colors",
            isChanged ? "doc-section--changed" : "",
            interactive ? "cursor-pointer" : ""
          ].join(" ")}
          style={highlightStyle}
          onClick={() => {
            if (!interactive) {
              return;
            }

            setSelectedAnchor(section.anchorId);
          }}
          onMouseEnter={(event) => {
            if (!interactive) {
              return;
            }

            event.currentTarget.style.background = hoverBackground;
          }}
          onMouseLeave={(event) => {
            if (!interactive) {
              return;
            }

            event.currentTarget.style.background = baseBackground;
          }}
        >
          {isChanged ? (
            <span className="absolute right-0 top-0 rounded-full bg-[rgba(184,84,61,0.1)] px-2 py-[2px] font-sans text-[9px] tracking-[0.18em] text-[#B8543D]">Changed</span>
          ) : null}

          <p className="font-sans text-[15px] leading-[1.8] text-[#1A1612]">{currentValue}</p>

          {isSelected ? <span className="absolute inset-0 rounded-r-lg ring-1 ring-[rgba(184,84,61,0.15)]" /> : null}
        </motion.div>
      );
    }

    if (section.type === "list") {
      return (
        <ul className="mb-5 list-disc pl-5 font-sans text-[15px] leading-[1.8] text-[#1A1612]">
          {currentValue.split("\n").map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <pre className="mb-5 overflow-x-auto rounded-2xl bg-[#FAF8F5] p-4 font-mono text-[13px] leading-6 text-[#1A1612]">{currentValue}</pre>
    );
  };

  return (
    <section className="doc-viewer-root relative h-full overflow-hidden bg-bg">
      <style>{`
        @media print {
          .doc-viewer-topbar,
          .doc-viewer-provenance {
            display: none !important;
          }

          .doc-viewer-root,
          .doc-viewer-document,
          .doc-viewer-content {
            background: white !important;
          }

          .doc-viewer-document {
            padding-top: 0 !important;
          }

          .doc-section--changed {
            background: transparent !important;
          }
        }
      `}</style>

      <div className="doc-viewer-topbar absolute inset-x-0 top-0 z-10 flex h-[52px] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] bg-[rgba(247,246,243,0.95)] px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[#78716C] transition-colors hover:text-[#1A1612]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <span className="h-4 w-px bg-[rgba(26,22,18,0.08)]" />
          <p className="truncate font-sans text-[15px] text-[#1A1612]">{projectName}</p>
          <span className="font-sans text-[13px] text-[rgba(120,113,108,0.6)]">/</span>
          <p className="truncate font-sans text-[13px] tracking-[0.08em] text-[#B8543D]">{viewer?.title ?? "DOCUMENT"}</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-[10px] py-1 font-mono text-[11px] text-[#78716C]">
            {viewer?.version ?? "v0.0"}
          </span>

          <motion.button
            type="button"
            whileHover={{ borderColor: "#B8543D", color: "#B8543D" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditMode((current) => !current)}
            className="rounded-xl border border-[rgba(26,22,18,0.08)] px-[14px] py-[6px] font-sans text-[12px] text-[#5A5450]"
          >Edit</motion.button>

          {editMode ? (
            <motion.button
              type="button"
              whileHover={{ backgroundColor: "#B8543D" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="rounded-xl bg-[#B8543D] px-[14px] py-[6px] font-sans text-[12px] tracking-[0.08em] text-white"
            >Save</motion.button>
          ) : null}

          <motion.button
            type="button"
            whileHover={{ backgroundColor: "#B8543D" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.print()}
            className="rounded-xl bg-[#1A1612] px-[14px] py-[6px] font-sans text-[12px] tracking-[0.08em] text-white"
          >Export PDF</motion.button>
        </div>
      </div>

      <div className={["flex h-full pt-[52px]", selectedAnchor ? "pr-[360px]" : ""].join(" ")}>
        <div className="doc-viewer-document flex-1 overflow-y-auto">
          <div className="doc-viewer-content mx-auto max-w-[720px] px-12 pb-20 pt-[72px]">
            <div className="mb-10">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(45,74,62,0.10)] text-[#B8543D]">
                  <FileTextIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-sans text-[28px] leading-none text-[#1A1612]">{viewer?.title ?? "Loading Document"}</h1>
                    <span className="font-mono text-[12px] text-[#78716C]">{viewer?.version}</span>
                  </div>
                  <p className="mt-2 font-sans text-[12px] text-[#78716C]">
                    Uploaded by {viewer?.uploadedBy ?? "Unknown"} · {viewer?.uploadedAt ?? "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 flex items-center gap-2 font-sans text-[12px] text-[#78716C]">
              <span>Sections with</span>
              <span className="h-2 w-2 rounded-full bg-[#B8543D]" />
              <span>have accepted changes. Click any section to see source evidence.</span>
            </div>

            <div className="mb-10 h-px bg-[rgba(26,22,18,0.08)]" />

            <motion.div initial="hidden" animate="visible" variants={sectionStagger}>
              {viewer?.sections.map((section) => (
                <motion.div
                  key={section.id}
                  variants={sectionItem}
                  className={section.hasChange ? "doc-section--changed" : undefined}
                >
                  {renderSection(section)}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAnchor ? (
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="doc-viewer-provenance fixed bottom-0 right-0 top-0 z-30 w-[360px] overflow-y-auto border-l border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.98)] p-6-[20px]"
          >
            <div className="mb-5 flex items-center">
              <p className="font-sans text-[13px] tracking-[0.12em] text-[#1A1612]">SOURCE EVIDENCE</p>
              <button
                type="button"
                onClick={() => setSelectedAnchor(null)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5] text-[#78716C] transition-colors hover:bg-[rgba(26,22,18,0.08)]"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {isLoadingProvenance ? (
              <p className="font-sans text-[13px] text-[#78716C]">Loading source evidence…</p>
            ) : provenance ? (
              <>
                <div className="mb-5">
                  <p className="mb-2 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">CITED TEXT</p>
                  <p className="mb-2 font-mono text-[11px] text-[rgba(120,113,108,0.6)]">{provenance.sourceDoc}</p>
                  <div className="rounded-r-lg bg-[rgba(184,84,61,0.04)] py-2 pl-3" style={{ borderLeft: "3px solid #B8543D" }}>
                    <p className="font-sans text-[13px] italic leading-6 text-[#5A5450]">{provenance.excerpt}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">SOURCE MESSAGES</p>
                  {provenance.linkedMessages.map((message) => {
                    const badge = platformBadge(message.platform);

                    return (
                      <div key={message.id} className="mb-[10px] rounded-2xl border border-[rgba(26,22,18,0.08)] bg-white p-[14px]">
                        <div className="flex items-center">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full font-sans text-[12px]"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </div>
                          <p className="ml-2 font-sans text-[12px] font-medium text-[#1A1612]">{message.from}</p>
                          <p className="ml-auto font-mono text-[11px] text-[#78716C]">{message.sentAt}</p>
                        </div>
                        <p
                          className="mt-2 font-sans text-[13px] italic leading-[1.6] text-[#5A5450]"
                          style={{
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 4
                          }}
                        >
                          {message.content}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <p className="mb-3 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">ACCEPTED CHANGES</p>
                  {provenance.acceptedChanges.map((change) => (
                    <div key={change.id} className="mb-[10px] rounded-2xl border border-[rgba(184,84,61,0.2)] bg-[rgba(45,74,62,0.10)] p-[14px]">
                      <p className="font-sans text-[13px] font-medium text-[#1A1612]">{change.summary}</p>
                      <div className="mt-2 flex items-center">
                        <span className="font-sans text-[10px] tracking-[0.12em] text-[#B8543D]">Accepted</span>
                        <span className="ml-2 font-sans text-[11px] text-[#78716C]">{change.acceptedBy}</span>
                        <span className="ml-auto font-mono text-[11px] text-[#78716C]">{change.acceptedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-6 w-full rounded-xl border-[1.5px] border-dashed border-[rgba(26,22,18,0.20)] py-3 text-center font-sans text-[12px] text-[#78716C] transition-colors hover:border-[#B8543D] hover:bg-[rgba(184,84,61,0.04)] hover:text-[#B8543D]"
                >Ask Socrates about this section</button>
              </>
            ) : (
              <div>
                <p className="font-sans text-[13px] text-[#78716C]">No provenance available for this section.</p>
                {activeSection ? <p className="mt-2 font-sans text-[12px] text-[rgba(120,113,108,0.6)]">{activeSection.content}</p> : null}
              </div>
            )}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
