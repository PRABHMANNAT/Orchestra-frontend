import { CONFLICTS, GAPS, STALE, TOP_FETCHED, PENDING_REVIEW } from "../data/mockBrainData";

function PulseCard({
  label,
  count,
  countColor,
  body,
  action
}: {
  label: string;
  count: string;
  countColor: string;
  body: React.ReactNode;
  action: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">{label}</span>
        <span className="font-mono text-[22px]" style={{ color: countColor }}>
          {count}
        </span>
      </div>
      <div className="min-h-[44px] text-[12px] leading-[1.5] text-[#5A5450]">{body}</div>
      <button className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-[#B8543D] hover:text-[#8C3E28]">
        {action} →
      </button>
    </div>
  );
}

export function BrainPulse() {
  return (
    <section className="py-8">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Brain Pulse</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <PulseCard
          label="Conflicts"
          count={String(CONFLICTS.length)}
          countColor="#9E3B2E"
          body={CONFLICTS[0]?.title}
          action="Resolve"
        />
        <PulseCard
          label="Gaps"
          count={String(GAPS.length)}
          countColor="#8C5D1E"
          body={GAPS[0]?.title}
          action="Capture"
        />
        <PulseCard
          label="Stale"
          count={String(STALE.length)}
          countColor="#C28840"
          body={STALE[0]?.title}
          action="Review"
        />
        <PulseCard
          label="Top Fetched"
          count={`${TOP_FETCHED[0]?.fetches}×`}
          countColor="#1A1612"
          body={
            <ul className="space-y-1">
              {TOP_FETCHED.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{t.title}</span>
                  <span className="font-mono text-[10px] text-[#A89C8A]">{t.fetches}×</span>
                </li>
              ))}
            </ul>
          }
          action="See all"
        />
        <PulseCard
          label="Pending Review"
          count={String(PENDING_REVIEW)}
          countColor="#5E7A8C"
          body="Memories awaiting team sign-off before agents can use them."
          action="Review queue"
        />
      </div>
    </section>
  );
}
