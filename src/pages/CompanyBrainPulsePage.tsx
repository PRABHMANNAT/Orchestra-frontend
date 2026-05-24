import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TbAlertTriangle,
  TbArrowRight,
  TbCheck,
  TbCircleFilled,
  TbHelp,
  TbHistory,
  TbMicrophone,
  TbPencil,
  TbPlus,
  TbRobot,
  TbUserCheck
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import {
  Card,
  DocMiniRef,
  FreshnessDot,
  PersonDisc
} from "../features/company-brain/components/BrainBits";
import {
  AUDIT,
  CONFLICTS,
  DOCS,
  GAPS,
  HAIR,
  INK,
  MUTED,
  ONBOARDING_STATUS,
  ORANGE,
  PENDING_REVIEW_IDS,
  PURPLE,
  RECENT_UPLOADS_IDS,
  RUST,
  STALE_DOC_IDS,
  TEAL,
  TOP_FETCHED_IDS,
  docById,
  personById
} from "../features/company-brain/data";
import { UploadModal } from "../features/company-brain/components/UploadModal";

export default function CompanyBrainPulsePage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (k: string) => setDismissed((s) => new Set(s).add(k));
  const isDismissed = (k: string) => dismissed.has(k);

  return (
    <>
      <BrainShell
        onUploadClick={() => setUploadOpen(true)}
        topBar={
          <BrainTopBar
            breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Brain Pulse" }]}
            title=""
            onUploadClick={() => setUploadOpen(true)}
            onPasteClick={() => setUploadOpen(true)}
          />
        }
        rightRail={<PulseRail />}
      >
        <div className="mx-auto max-w-[920px] px-6 py-6">
          <header className="mb-6">
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              BRAIN PULSE
            </p>
            <h1 className="mt-1 font-sans text-[24px] leading-tight" style={{ color: INK }}>
              The health of your company brain
            </h1>
            <p className="mt-1 max-w-[640px] font-sans text-[13px] leading-6" style={{ color: MUTED }}>
              What's contradicting itself, what's missing, what's going stale, what people and agents
              are actually fetching. Every item has a next action.
            </p>
          </header>

          <div className="space-y-4">
            {!isDismissed("conflicts") ? <ConflictsCard onDismiss={() => dismiss("conflicts")} /> : null}
            {!isDismissed("gaps") ? <GapsCard onDismiss={() => dismiss("gaps")} /> : null}
            {!isDismissed("stale") ? <StaleCard onDismiss={() => dismiss("stale")} /> : null}
            {!isDismissed("recent") ? <RecentCard onDismiss={() => dismiss("recent")} /> : null}
            {!isDismissed("top") ? <TopFetchedCard onDismiss={() => dismiss("top")} /> : null}
            {!isDismissed("pending") ? <PendingReviewCard onDismiss={() => dismiss("pending")} /> : null}
            {!isDismissed("onboard") ? <OnboardingCard onDismiss={() => dismiss("onboard")} /> : null}
          </div>
        </div>
      </BrainShell>
      {uploadOpen ? <UploadModal onClose={() => setUploadOpen(false)} /> : null}
    </>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────

function ConflictsCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${RUST}14`, color: RUST }}>
            <TbAlertTriangle className="h-3 w-3" strokeWidth={1.5} />
          </span>
          Conflicts detected
          <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `${RUST}10`, color: RUST }}>
            {CONFLICTS.length}
          </span>
        </span>
      }
      subtitle="Doc pairs where the brain found contradictions."
      onDismiss={onDismiss}
      onRefresh={() => {}}
    >
      <ul className="divide-y" style={{ borderColor: HAIR }}>
        {CONFLICTS.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-start gap-3 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${HAIR}` }}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]" style={{ color: MUTED }}>
                <DocMiniRef docId={c.docA.id} />
                <span>vs</span>
                <DocMiniRef docId={c.docB.id} />
              </div>
              <p className="mt-1 font-sans text-[13px]" style={{ color: INK }}>
                Disagreement on <span style={{ color: RUST }}>{c.topic}</span>: {c.claim}
              </p>
            </div>
            <Link
              to="/company-brain/search"
              className="self-start rounded-[6px] px-3 py-1.5 font-sans text-[12px] text-white"
              style={{ background: RUST }}
            >
              Resolve
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function GapsCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${PURPLE}14`, color: PURPLE }}>
            <TbHelp className="h-3 w-3" strokeWidth={1.5} />
          </span>
          Knowledge gaps
          <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `${PURPLE}14`, color: PURPLE }}>
            {GAPS.length}
          </span>
        </span>
      }
      subtitle="Missing knowledge inferred from what people are asking."
      onDismiss={onDismiss}
      onRefresh={() => {}}
    >
      <ul className="divide-y" style={{ borderColor: HAIR }}>
        {GAPS.map((g, i) => (
          <li key={g.id} className="flex flex-wrap items-start gap-3 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${HAIR}` }}>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[13px]" style={{ color: INK }}>
                {g.topic}
              </p>
              <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>
                {g.signal}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 font-sans text-[11px] text-white"
                style={{ background: PURPLE }}
              >
                <TbPencil className="h-3 w-3" strokeWidth={1.5} />
                request doc
              </button>
              <button type="button" className="inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: INK }}>
                <TbMicrophone className="h-3 w-3" strokeWidth={1.5} />
                record loom
              </button>
              <button type="button" className="inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: MUTED }}>
                known gap
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StaleCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${ORANGE}14`, color: ORANGE }}>
            <TbHistory className="h-3 w-3" strokeWidth={1.5} />
          </span>
          Stale docs
          <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `${ORANGE}14`, color: ORANGE }}>
            {STALE_DOC_IDS.length}
          </span>
        </span>
      }
      subtitle="Not accessed in 6+ months or past expiry."
      onDismiss={onDismiss}
      onRefresh={() => {}}
    >
      <ul className="divide-y" style={{ borderColor: HAIR }}>
        {STALE_DOC_IDS.map((id, i) => {
          const d = docById(id);
          if (!d) return null;
          return (
            <li key={id} className="flex flex-wrap items-start gap-3 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${HAIR}` }}>
              <div className="min-w-0 flex-1">
                <DocMiniRef docId={id} />
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>
                  last access {d.uploadedAt} · {d.expiresAt ?? "no expiry set"}
                </p>
              </div>
              <FreshnessDot value={d.freshness} withLabel />
              <div className="flex items-center gap-1.5">
                <button type="button" className="rounded-[6px] border px-2 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: INK }}>
                  Review
                </button>
                <button type="button" className="rounded-[6px] border px-2 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: INK }}>
                  Update
                </button>
                <button type="button" className="rounded-[6px] border px-2 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: MUTED }}>
                  Archive
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title="Recently added"
      subtitle="Last 10 uploads."
      onDismiss={onDismiss}
      onRefresh={() => {}}
    >
      <ul className="space-y-2">
        {RECENT_UPLOADS_IDS.map((id) => {
          const d = docById(id);
          if (!d) return null;
          const uploader = personById(d.uploaderId);
          return (
            <li key={id} className="flex items-center gap-3 rounded-[6px] border px-3 py-2" style={{ borderColor: HAIR }}>
              <PersonDisc person={uploader} size={20} />
              <div className="min-w-0 flex-1">
                <DocMiniRef docId={id} />
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {uploader?.name} · {d.uploadedAt} · {d.source}
                </p>
              </div>
              <FreshnessDot value={d.freshness} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function TopFetchedCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title="Top fetched this week"
      subtitle="Humans vs agents, separated."
      onDismiss={onDismiss}
      onRefresh={() => {}}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
            BY HUMANS
          </p>
          <ul className="space-y-1.5">
            {[...TOP_FETCHED_IDS]
              .sort((a, b) => (docById(b)?.fetchedThisWeek?.humans ?? 0) - (docById(a)?.fetchedThisWeek?.humans ?? 0))
              .slice(0, 5)
              .map((id) => {
                const d = docById(id);
                if (!d) return null;
                return (
                  <li key={`h-${id}`} className="flex items-center justify-between gap-2">
                    <DocMiniRef docId={id} />
                    <span className="font-mono text-[11px]" style={{ color: INK }}>
                      {d.fetchedThisWeek?.humans ?? 0}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1 font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
            <TbRobot className="h-3 w-3" strokeWidth={1.5} /> BY AGENTS
          </p>
          <ul className="space-y-1.5">
            {[...TOP_FETCHED_IDS]
              .sort((a, b) => (docById(b)?.fetchedThisWeek?.agents ?? 0) - (docById(a)?.fetchedThisWeek?.agents ?? 0))
              .slice(0, 5)
              .map((id) => {
                const d = docById(id);
                if (!d) return null;
                return (
                  <li key={`a-${id}`} className="flex items-center justify-between gap-2">
                    <DocMiniRef docId={id} />
                    <span className="font-mono text-[11px]" style={{ color: PURPLE }}>
                      {d.fetchedThisWeek?.agents ?? 0}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function PendingReviewCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Card
      title="Pending review"
      subtitle="Flagged by agents or humans as wrong or outdated."
      onDismiss={onDismiss}
    >
      <ul className="divide-y" style={{ borderColor: HAIR }}>
        {PENDING_REVIEW_IDS.map((id, i) => {
          const d = docById(id);
          if (!d) return null;
          return (
            <li key={id} className="flex flex-wrap items-start gap-3 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${HAIR}` }}>
              <div className="min-w-0 flex-1">
                <DocMiniRef docId={id} />
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>
                  flagged by an agent · cited in 12 responses this week
                </p>
              </div>
              <Link
                to="/company-brain/feedback"
                className="rounded-[6px] border px-2.5 py-1 font-sans text-[11px]"
                style={{ borderColor: HAIR, color: INK }}
              >
                Open feedback
              </Link>
              <button type="button" className="rounded-[6px] px-2.5 py-1 font-sans text-[11px] text-white" style={{ background: RUST }}>
                Fix doc
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function OnboardingCard({ onDismiss }: { onDismiss: () => void }) {
  const o = ONBOARDING_STATUS;
  const done = o.playlist.filter((p) => p.done).length;
  const pct = Math.round((done / o.playlist.length) * 100);
  return (
    <Card
      title="Onboarding status"
      subtitle={`${o.hireName} · day ${o.joinedDays}`}
      onDismiss={onDismiss}
      actions={
        <span className="rounded-full px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `${TEAL}14`, color: TEAL }}>
          {done}/{o.playlist.length} · {pct}%
        </span>
      }
    >
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full" style={{ background: HAIR }}>
        <div className="h-full rounded-full" style={{ background: TEAL, width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {o.playlist.map((p) => (
          <li key={p.docId} className="flex items-center gap-2">
            <span
              className="flex h-4 w-4 items-center justify-center rounded-[4px] border"
              style={{
                borderColor: p.done ? TEAL : HAIR,
                background: p.done ? `${TEAL}14` : "transparent",
                color: TEAL
              }}
            >
              {p.done ? <TbCheck className="h-3 w-3" strokeWidth={2} /> : null}
            </span>
            <DocMiniRef docId={p.docId} />
            <span className="ml-auto font-mono text-[10px]" style={{ color: MUTED }}>
              {p.doneAt}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: HAIR }}>
        <p className="font-mono text-[10px]" style={{ color: MUTED }}>
          <TbUserCheck className="mr-1 inline h-3 w-3" strokeWidth={1.5} />
          buddy: Adhiraj
        </p>
        <button type="button" className="rounded-[6px] border px-2.5 py-1 font-sans text-[11px]" style={{ borderColor: HAIR, color: INK }}>
          <TbPlus className="mr-1 inline h-3 w-3" strokeWidth={1.5} />
          add to playlist
        </button>
      </div>
    </Card>
  );
}

// ─── Right rail ───────────────────────────────────────────────────────────

function PulseRail() {
  const watching = DOCS.filter((d) => d.freshness !== "fresh").length;
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          NOW
        </p>
        <div className="space-y-2">
          <RailStat label="Conflicts open"  value={CONFLICTS.length} accent={RUST} />
          <RailStat label="Gaps identified" value={GAPS.length}      accent={PURPLE} />
          <RailStat label="Going stale"     value={watching}         accent={ORANGE} />
          <RailStat label="Pending review"  value={PENDING_REVIEW_IDS.length} accent={RUST} />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
          LIVE ACTIVITY
        </p>
        <ul className="space-y-2">
          {AUDIT.slice(0, 5).map((a) => {
            const p = personById(a.actorId);
            return (
              <li key={a.id} className="flex items-start gap-2 rounded-[6px] border px-2.5 py-2" style={{ borderColor: HAIR }}>
                <span
                  className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: a.actorKind === "agent" ? `${PURPLE}14` : `${p?.color ?? MUTED}14`,
                    color: a.actorKind === "agent" ? PURPLE : p?.color ?? MUTED
                  }}
                >
                  {a.actorKind === "agent" ? <TbRobot className="h-3 w-3" strokeWidth={1.5} /> : <TbCircleFilled className="h-2 w-2" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[12px]" style={{ color: INK }}>
                    <span style={{ color: MUTED }}>{p?.name ?? a.actorId}</span> {a.action.replace(/-/g, " ")}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px]" style={{ color: MUTED }}>
                    {a.docTitle}
                  </p>
                </div>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>{a.ts.split(" ")[0]}</span>
              </li>
            );
          })}
        </ul>
        <Link
          to="/company-brain/audit"
          className="mt-2 inline-flex items-center gap-1 font-sans text-[12px]"
          style={{ color: RUST }}
        >
          full audit log <TbArrowRight className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

function RailStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between rounded-[6px] border px-3 py-2" style={{ borderColor: HAIR }}>
      <span className="font-sans text-[12px]" style={{ color: INK }}>{label}</span>
      <span className="font-mono text-[14px]" style={{ color: accent }}>{value}</span>
    </div>
  );
}
