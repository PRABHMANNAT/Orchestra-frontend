import { useState } from "react";
import { TopMetaBar } from "./components/TopMetaBar";
import { HeroZone } from "./components/HeroZone";
import { KnowledgeGlobe } from "./components/KnowledgeGlobe";
import { RelationshipWeb } from "./components/RelationshipWeb";
import { SourcesStrip } from "./components/SourcesStrip";
import { IngestionRiver } from "./components/IngestionRiver";
import { DocumentsView } from "./components/DocumentsView";
import { MemorySection } from "./components/MemorySection";
import { BrainPulse } from "./components/BrainPulse";
import { BrainStats } from "./components/BrainStats";
import { SearchExpanded } from "./components/SearchExpanded";
import { DocumentDrawer } from "./components/DocumentDrawer";
import { CaptureModal } from "./components/CaptureModal";
import type { Doc, DomainId } from "./data/mockBrainData";

export function BrainPage() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F1EB] text-[#1A1612]">
      <TopMetaBar
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setSearchOpen(q.length > 0);
        }}
        onFocusSearch={() => {
          const input = document.getElementById("brain-search") as HTMLInputElement | null;
          input?.focus();
        }}
        onOpenCapture={() => setCaptureOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1640px] px-5 pb-12 md:px-8">
          <HeroZone />

          {/* Signature row: Globe (45%) + Stats (55%) */}
          <section className="pb-10">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="h-[600px] xl:h-[680px] lg:basis-[45%]">
                <KnowledgeGlobe selectedDomain={selectedDomain} onSelectDomain={setSelectedDomain} />
              </div>
              <div className="h-[600px] xl:h-[680px] lg:basis-[55%]">
                <BrainStats />
              </div>
            </div>
          </section>

          <SourcesStrip />
          <IngestionRiver />

          {/* Memory clusters — visual blocks per domain */}
          <MemorySection
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
            onSelectDoc={setSelectedDoc}
          />

          {/* People + projects */}
          <DocumentsView selectedDomain={selectedDomain} onSelectDoc={setSelectedDoc} />

          <BrainPulse />

          {/* Relationship Web — full content width */}
          <section className="mt-10 pt-10 border-t border-[rgba(26,22,18,0.08)]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">
                  How everything connects
                </div>
                <h2 className="mt-2 font-serif text-[34px] leading-[1.1] tracking-[-0.012em] text-[#1A1612]">
                  The shape of what Northstar knows
                </h2>
              </div>
              <div className="hidden text-right md:block">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A89C8A]">
                  4 projects · 30 nodes · 36 edges
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#A89C8A]">
                  hover a node to reveal its neighbourhood
                </div>
              </div>
            </div>
            <div className="h-[640px] xl:h-[720px]">
              <RelationshipWeb />
            </div>
          </section>
        </div>
      </div>

      {searchOpen ? (
        <SearchExpanded
          query={query}
          onClose={() => {
            setSearchOpen(false);
            setQuery("");
          }}
        />
      ) : null}

      <DocumentDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      <CaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
