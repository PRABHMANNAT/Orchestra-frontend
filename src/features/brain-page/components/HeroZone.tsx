export function HeroZone() {
  return (
    <div className="flex items-end justify-between gap-6 pt-10 pb-8">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8A7E6F]">Company Brain</div>
        <h1 className="mt-3 font-serif text-[52px] leading-[1.05] tracking-[-0.015em] text-[#1A1612]">
          Everything Northstar Cloud knows
        </h1>
        <p className="mt-3 max-w-[640px] text-[15px] leading-[1.6] text-[#5A5450]">
          1,247 memories from 8 connected sources. Queryable by every human and agent.
        </p>
      </div>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5A5450]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#7A8C5F] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A8C5F]" />
        </span>
        syncing · 142 new this week
      </div>
    </div>
  );
}
