import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileTextIcon, SearchIcon, UploadCloudIcon, UploadIcon } from "../components/ui/AppIcons";
import { getDocs, uploadDoc } from "../lib/api";
import type { Doc } from "../lib/types";

type MemoryTab = "all" | "source-docs" | "communications" | "decisions" | "changes";

type TypeVisual = {
  bg: string;
  iconColor: string;
};

const tabOptions: Array<{ id: MemoryTab; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "source-docs", label: "SOURCE DOCS" },
  { id: "communications", label: "COMMUNICATIONS" },
  { id: "decisions", label: "DECISIONS" },
  { id: "changes", label: "Changes" }
];

const uploadOptions: Array<{ id: Doc["type"]; label: string }> = [
  { id: "prd", label: "PRD" },
  { id: "srs", label: "SRS" },
  { id: "spec", label: "SPEC" },
  { id: "transcript", label: "TRANSCRIPT" },
  { id: "audio", label: "AUDIO" },
  { id: "image", label: "IMAGE" },
  { id: "change", label: "CHANGE" },
  { id: "decision", label: "DECISION" }
];

const typeVisuals: Record<Doc["type"], TypeVisual> = {
  prd: { bg: "rgba(45,74,62,0.10)", iconColor: "#B8543D" },
  srs: { bg: "rgba(45,74,62,0.10)", iconColor: "#B8543D" },
  spec: { bg: "rgba(120,113,108,0.10)", iconColor: "#5A5450" },
  transcript: { bg: "rgba(194,136,64,0.12)", iconColor: "#B8543D" },
  audio: { bg: "rgba(194,136,64,0.12)", iconColor: "#B8543D" },
  image: { bg: "#fff0f8", iconColor: "#e05590" },
  change: { bg: "rgba(158,59,46,0.10)", iconColor: "#9E3B2E" },
  decision: { bg: "rgba(120,113,108,0.10)", iconColor: "#5A5450" }
};

const extensionMap: Record<Doc["type"], string> = {
  prd: ".pdf",
  srs: ".pdf",
  spec: ".pdf",
  transcript: ".txt",
  audio: ".mp3",
  image: ".png",
  change: ".md",
  decision: ".txt"
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getDocTab(doc: Doc): Exclude<MemoryTab, "all"> {
  if (doc.type === "change") {
    return "changes";
  }

  if (doc.type === "decision") {
    return "decisions";
  }

  if (doc.name === "Payment Flow Diagram") {
    return "changes";
  }

  if (doc.name === "Stakeholder Email Thread" || doc.name === "Client Kickoff Call") {
    return "decisions";
  }

  if (doc.type === "transcript" || doc.type === "audio") {
    return "communications";
  }

  return "source-docs";
}

function getFilename(doc: Doc) {
  return `${doc.name}${extensionMap[doc.type]}`;
}

export function ProjectMemoryPage() {
  const navigate = useNavigate();
  const { id = "1" } = useParams();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MemoryTab>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState<Doc["type"] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      const docItems = await getDocs(id);
      if (isCancelled) {
        return;
      }

      setDocs(docItems.map((item) => ({ ...item })));
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const visibleDocs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return docs.filter((doc) => {
      const matchesTab = activeTab === "all" ? true : getDocTab(doc) === activeTab;
      if (!matchesTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [doc.name, doc.excerpt, doc.uploadedBy, doc.uploadedAt].some((value) => value.toLowerCase().includes(query));
    });
  }, [activeTab, docs, searchQuery]);

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setSelectedUploadType(null);
    setSelectedFile(null);
    setIsDropActive(false);
    setIsUploading(false);
  };

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setIsDropActive(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedUploadType) {
      return;
    }

    setIsUploading(true);
    const nextDoc = await uploadDoc(id, selectedFile, selectedUploadType);
    setDocs((current) => [{ ...nextDoc }, ...current]);
    closeUploadModal();
  };

  return (
    <section className="relative h-full overflow-y-auto bg-bg">
      <div className="flex min-h-full">
        <div className="flex-1 px-12 py-10">
          <div className="max-w-[920px]">
            <div>
              <p className="mb-2 font-sans text-[11px] tracking-[0.18em] text-[#5A5450]">MEMORY</p>
              <h1 className="font-sans text-[56px] leading-none text-[#1A1612]">Project memory</h1>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-[3px] w-10 rounded-full bg-[#5A5450]" />
                <span className="h-[3px] w-5 rounded-full bg-[rgba(26,22,18,0.08)]" />
              </div>
              <p className="mb-10 mt-4 max-w-[760px] font-sans text-[15px] leading-7 text-[#78716C]">
                Search decisions, changes, client messages, briefs, and source material from one evidence trail.
              </p>
            </div>

            <div
              className="mb-10 flex h-16 items-center gap-4 rounded-[20px] border-[1.5px] border-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.7)] px-6-[20px]"
            >
              <div className="flex-shrink-0 text-[rgba(120,113,108,0.6)]">
                <SearchIcon className="h-5 w-5" />
              </div>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ask anything about this project - decisions, changes, what the client said..."
                className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-[#1A1612] outline-none placeholder:text-[rgba(120,113,108,0.6)]"
              />
              <span className="rounded-lg border border-[rgba(26,22,18,0.08)] bg-[rgba(0,0,0,0.04)] px-[10px] py-1 font-mono text-[12px] text-[rgba(120,113,108,0.6)]">
                CMD K
              </span>
            </div>

            <div className="mb-6 flex overflow-x-auto border-b border-[rgba(26,22,18,0.08)]">
              {tabOptions.map((tab) => {
                const active = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "border-b-2 px-5 py-3 font-sans text-[12px] tracking-[0.12em] transition-colors",
                      active ? "border-[#5A5450] text-[#1A1612]" : "border-transparent text-[#78716C] hover:text-[#1A1612]"
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <p className="mb-4 font-sans text-[11px] tracking-[0.18em] text-[#78716C]">SOURCE DOCUMENTS</p>

            <AnimatePresence mode="popLayout">
              {visibleDocs.length > 0 ? (
                <div>
                  {visibleDocs.map((doc, index) => {
                    const visual = typeVisuals[doc.type];
                    const roundedClass =
                      visibleDocs.length === 1
                        ? "rounded-[16px]"
                        : index === 0
                          ? "rounded-t-[16px]"
                          : index === visibleDocs.length - 1
                            ? "rounded-b-[16px]"
                            : "";

                    return (
                      <motion.article
                        key={doc.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        className={[
                          "relative cursor-pointer border border-[rgba(26,22,18,0.08)] bg-white px-6 py-5 transition-colors hover:bg-[#FAF8F5]",
                          roundedClass,
                          index > 0 ? "-mt-px" : ""
                        ].join(" ")}
                        onClick={() => navigate(`/projects/${id}/docs/${doc.id}/view`)}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ background: visual.bg, color: visual.iconColor }}
                          >
                            <FileTextIcon className="h-[18px] w-[18px]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="min-w-0 truncate font-sans text-[15px] font-medium text-[#1A1612]">{doc.name}</p>
                              {doc.status === "processing" ? (
                                <motion.span
                                  className="ml-auto h-1.5 w-1.5 rounded-full bg-[#B8543D]"
                                  animate={{ scale: [1, 1.35, 1], opacity: [1, 0.55, 1] }}
                                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                                />
                              ) : (
                                <span
                                  className="ml-auto h-1.5 w-1.5 rounded-full"
                                  style={{ background: doc.status === "ready" ? "#B8543D" : "#9E3B2E" }}
                                />
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center font-mono text-[12px] text-[#78716C]">
                              <span>{getFilename(doc)}</span>
                              <span className="mx-[6px]">·</span>
                              <span>{doc.uploadedAt}</span>
                            </div>

                            <p
                              className="mt-[10px] font-sans text-[13px] leading-[1.6] text-[#5A5450]"
                              style={{
                                display: "-webkit-box",
                                overflow: "hidden",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2
                              }}
                            >
                              {doc.excerpt}
                            </p>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[16px] border border-[rgba(26,22,18,0.08)] bg-white px-6 py-8"
                >
                  <p className="font-sans text-[16px] tracking-[0.08em] text-[#1A1612]">No memory found</p>
                  <p className="mt-2 font-sans text-[13px] text-[#78716C]">Try a different query or switch tabs.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => setIsUploadOpen(true)}
      whileHover={{ scale: 1.04, backgroundColor: "#B8543D" }}
      whileTap={{ scale: 0.98 }}
      className="fixed bottom-8 z-20 inline-flex items-center gap-2 rounded-full bg-[#1A1612] px-6 py-[14px] font-sans text-[14px] tracking-[0.08em] text-white"
      style={{ right: "340px" }}
    >
      <UploadIcon className="h-4 w-4" />Upload</motion.button>

      <AnimatePresence>
        {isUploadOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeUploadModal}
            className="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(0,0,0,0.4)]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-[420px] rounded-2xl bg-white p-8"
            >
              <p className="font-sans text-[20px] tracking-[0.06em] text-[#1A1612]">Upload document</p>
              <p className="mb-5 mt-2 font-sans text-[13px] text-[#78716C]">Add a new file to the project docs library.</p>

              <div
                role="presentation"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDropActive(true);
                }}
                onDragLeave={() => setIsDropActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed bg-[#FAF8F5] px-6 py-8 text-center transition-colors"
                style={{
                  borderColor: isDropActive ? "#B8543D" : "rgba(26,22,18,0.08)",
                  background: isDropActive ? "rgba(184,84,61,0.04)" : "#FAF8F5"
                }}
              >
                <div className="flex justify-center text-[rgba(120,113,108,0.6)]">
                  <UploadCloudIcon className="h-8 w-8" />
                </div>

                {selectedFile ? (
                  <>
                    <p className="mt-3 font-sans text-[14px] font-medium text-[#1A1612]">{selectedFile.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-[rgba(120,113,108,0.6)]">{formatFileSize(selectedFile.size)}</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-sans text-[14px] text-[#78716C]">Drop files here</p>
                    <p className="mt-1 font-sans text-[12px] text-[#B8543D] underline">or click to browse</p>
                    <p className="mt-2 font-mono text-[11px] text-[rgba(120,113,108,0.6)]">PDF · DOCX · TXT · MP3 · MP4 · PNG · JPG</p>
                  </>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.mp3,.mp4,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>

              <div className="mt-5">
                <p className="mb-2 font-sans text-[10px] tracking-[0.16em] text-[rgba(120,113,108,0.6)]">DOCUMENT TYPE</p>
                <div className="grid grid-cols-4 gap-2">
                  {uploadOptions.map((option) => {
                    const active = selectedUploadType === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedUploadType(option.id)}
                        className={[
                          "rounded-xl border px-3 py-3 text-center font-sans text-[11px] tracking-[0.1em] transition-colors",
                          active
                            ? "border-[#B8543D] bg-[rgba(184,84,61,0.06)] text-[#1A1612]"
                            : "border-[rgba(26,22,18,0.08)] bg-white text-[#5A5450] hover:border-[#B8543D]"
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeUploadModal} className="font-sans text-[13px] text-[#78716C]">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || !selectedUploadType || isUploading}
                  onClick={() => void handleUpload()}
                  className="rounded-xl bg-[#1A1612] px-5 py-2.5 font-sans text-[13px] tracking-[0.08em] text-white transition-colors hover:bg-[#B8543D] disabled:cursor-not-allowed disabled:bg-[rgba(120,113,108,0.6)]"
                >Upload</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
