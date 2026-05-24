import { useMemo, useState } from "react";
import {
  TbAlertTriangle,
  TbDownload,
  TbFilter,
  TbRobot,
  TbUser
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import { DocMiniRef, FilterChip, PersonDisc } from "../features/company-brain/components/BrainBits";
import {
  AUDIT,
  HAIR,
  INK,
  MUTED,
  PEOPLE,
  PURPLE,
  RUST,
  TEAL,
  personById
} from "../features/company-brain/data";

type ActionFilter = "all" | "viewed" | "fetched" | "edited" | "used-in-agent-response" | "downloaded";

export default function CompanyBrainAuditPage() {
  const [actor, setActor] = useState<string | "all">("all");
  const [kind, setKind] = useState<"all" | "human" | "agent">("all");
  const [action, setAction] = useState<ActionFilter>("all");
  const [docFilter, setDocFilter] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("today");

  const filtered = useMemo(() => {
    return AUDIT.filter((a) => {
      if (kind !== "all" && a.actorKind !== kind) return false;
      if (actor !== "all" && a.actorId !== actor) return false;
      if (action !== "all" && a.action !== action) return false;
      if (docFilter && !a.docTitle.toLowerCase().includes(docFilter.toLowerCase())) return false;
      if (onlySuspicious && !a.suspicious) return false;
      // date is symbolic on mock data; skip
      return true;
    });
  }, [actor, kind, action, docFilter, onlySuspicious]);

  const flagged = AUDIT.filter((a) => a.suspicious).length;

  return (
    <BrainShell
      topBar={
        <BrainTopBar
          breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Audit log" }]}
          title="Audit log"
          actions={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 font-sans text-[12px]"
              style={{ borderColor: HAIR, color: INK }}
            >
              <TbDownload className="h-3.5 w-3.5" strokeWidth={1.5} />
              export CSV
            </button>
          }
        />
      }
    >
      <div className="mx-auto max-w-[1100px] px-6 py-6">
        {/* summary strip */}
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <StatTile label="Events today" value={AUDIT.length} accent={INK} />
          <StatTile label="By humans" value={AUDIT.filter((a) => a.actorKind === "human").length} accent={TEAL} />
          <StatTile label="By agents" value={AUDIT.filter((a) => a.actorKind === "agent").length} accent={PURPLE} />
          <StatTile label="Flagged suspicious" value={flagged} accent={RUST} />
        </div>

        {/* filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[8px] border bg-white px-3 py-2" style={{ borderColor: HAIR }}>
          <TbFilter className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: MUTED }} />
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="rounded-[6px] border bg-white px-1.5 py-0.5 font-mono text-[11px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <option value="all">all actors</option>
            {PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="rounded-[6px] border bg-white px-1.5 py-0.5 font-mono text-[11px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <option value="all">human or agent</option>
            <option value="human">human only</option>
            <option value="agent">agent only</option>
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionFilter)}
            className="rounded-[6px] border bg-white px-1.5 py-0.5 font-mono text-[11px]"
            style={{ borderColor: HAIR, color: INK }}
          >
            <option value="all">all actions</option>
            <option value="viewed">viewed</option>
            <option value="fetched">fetched</option>
            <option value="used-in-agent-response">used in agent response</option>
            <option value="edited">edited</option>
            <option value="downloaded">downloaded</option>
          </select>
          <input
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            placeholder="doc title…"
            className="rounded-[6px] border bg-white px-2 py-0.5 font-mono text-[11px]"
            style={{ borderColor: HAIR, color: INK }}
          />
          {(["today", "week", "month", "all"] as const).map((r) => (
            <FilterChip
              key={r}
              label={r}
              active={dateRange === r}
              onClick={() => setDateRange(r)}
            />
          ))}
          <FilterChip
            label="suspicious only"
            active={onlySuspicious}
            onClick={() => setOnlySuspicious((x) => !x)}
            accent={RUST}
          />
          <span className="ml-auto font-mono text-[10px]" style={{ color: MUTED }}>
            {filtered.length} of {AUDIT.length}
          </span>
        </div>

        {/* timeline */}
        <section className="rounded-[8px] border bg-white" style={{ borderColor: HAIR }}>
          <header
            className="grid grid-cols-[80px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.6fr)] gap-3 border-b px-4 py-2 font-mono text-[10px] tracking-[0.16em]"
            style={{ borderColor: HAIR, color: MUTED }}
          >
            <span>TIME</span>
            <span>ACTOR</span>
            <span>ACTION</span>
            <span>DOCUMENT</span>
            <span>CONTEXT</span>
          </header>
          <ul>
            {filtered.map((a) => {
              const person = personById(a.actorId);
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[80px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.6fr)] items-start gap-3 px-4 py-2.5"
                  style={{ borderTop: `1px solid ${HAIR}`, background: a.suspicious ? `${RUST}06` : "transparent" }}
                >
                  <span className="font-mono text-[11px]" style={{ color: MUTED }}>
                    {a.ts}
                  </span>
                  <div className="flex min-w-0 items-center gap-2">
                    {a.actorKind === "agent" ? (
                      <span
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: `${PURPLE}14`, color: PURPLE }}
                      >
                        <TbRobot className="h-3 w-3" strokeWidth={1.5} />
                      </span>
                    ) : (
                      <PersonDisc person={person} size={20} />
                    )}
                    <span className="truncate font-sans text-[12px]" style={{ color: INK }}>
                      {person?.name ?? a.actorId}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                      style={{
                        background: a.actorKind === "agent" ? `${PURPLE}14` : "#F1ECE4",
                        color: a.actorKind === "agent" ? PURPLE : MUTED
                      }}
                    >
                      {a.actorKind}
                    </span>
                  </div>
                  <span
                    className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                    style={{
                      background: a.action === "used-in-agent-response" ? `${PURPLE}14` : a.action === "edited" ? `${TEAL}14` : a.action === "downloaded" ? `${RUST}10` : "#F1ECE4",
                      color: a.action === "used-in-agent-response" ? PURPLE : a.action === "edited" ? TEAL : a.action === "downloaded" ? RUST : MUTED,
                      width: "fit-content"
                    }}
                  >
                    {a.action.replace(/-/g, " ")}
                  </span>
                  <div className="min-w-0">
                    <DocMiniRef docId={a.docId} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px]" style={{ color: MUTED }}>
                      {a.context}
                    </p>
                    {a.suspicious ? (
                      <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px]" style={{ color: RUST }}>
                        <TbAlertTriangle className="h-3 w-3" strokeWidth={1.5} />
                        {a.suspicious}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-4 py-10 text-center font-sans text-[13px]" style={{ color: MUTED }}>
                no events match these filters.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </BrainShell>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[8px] border bg-white p-3" style={{ borderColor: HAIR }}>
      <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
        {label.toUpperCase()}
      </p>
      <p className="mt-1 font-sans text-[20px] leading-none" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
