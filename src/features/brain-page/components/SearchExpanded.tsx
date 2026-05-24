import { DOCS, TOP_FETCHED, AGENT_FEED } from "../data/mockBrainData";

type Props = {
  query: string;
  onClose: () => void;
};

export function SearchExpanded({ query, onClose }: Props) {
  if (!query) return null;

  const matches = DOCS.filter((d) =>
    (d.title + " " + d.summary).toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-[rgba(26,22,18,0.16)] px-4 pt-[88px]" onClick={onClose}>
      <div
        className="w-full max-w-[820px] overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white shadow-[0_24px_64px_rgba(26,22,18,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Direct answer */}
        <div className="border-b border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Direct answer</div>
          <p className="mt-2 font-serif text-[16px] leading-[1.6] text-[#1A1612]">
            {`Northstar uses JWT-based auth with 30d refresh tokens. The decision was made in `}
            <CitationChip label="dec-jwt" />
            {` over session cookies for stateless scaling. The Aurora migration `}
            <CitationChip label="dec-aurora" />
            {` enables horizontal read replicas. Acme's SSO requirements `}
            <CitationChip label="doc-sso" />
            {` are tracked separately from the general auth flow.`}
          </p>
        </div>

        {/* Matching documents */}
        <div className="border-b border-[rgba(26,22,18,0.08)] p-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Matching memories</div>
          <ul className="space-y-1.5">
            {matches.length === 0 ? (
              <li className="text-[13px] text-[#8A7E6F]">No matches — try Scout for a deeper search.</li>
            ) : (
              matches.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 rounded-[3px] px-2 py-1.5 hover:bg-[#FAF8F5]">
                  <span className="truncate text-[13px] text-[#1A1612]">{d.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#A89C8A]">
                    {d.source}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Related concepts */}
        <div className="border-b border-[rgba(26,22,18,0.08)] p-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Related concepts</div>
          <div className="flex flex-wrap gap-2">
            {["session storage", "OIDC", "SAML", "token rotation", "Aurora read replicas", "rate limiting"].map((c) => (
              <span key={c} className="rounded-full border border-[rgba(26,22,18,0.08)] bg-white px-2.5 py-1 text-[11px] text-[#5A5450]">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* People + projects */}
        <div className="grid grid-cols-2 gap-5 p-5">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">People who know this</div>
            <div className="flex -space-x-2">
              {["KR", "AS", "PM", "HT", "MT"].map((init, i) => (
                <div
                  key={init}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white font-mono text-[10px] text-white"
                  style={{ background: ["#B8543D", "#7A8C5F", "#8B7FD4", "#2D4A3E", "#5E7A8C"][i] }}
                >
                  {init}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Active projects</div>
            <div className="flex flex-wrap gap-1.5">
              {["Northstar Cloud", "Acme Integration", "Payments v2"].map((p) => (
                <span key={p} className="rounded-[3px] bg-[rgba(184,84,61,0.08)] px-2 py-1 text-[11px] text-[#B8543D]">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CitationChip({ label }: { label: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center rounded-[3px] bg-[rgba(184,84,61,0.10)] px-1.5 py-0.5 font-mono text-[10px] text-[#B8543D]">
      {label}
    </span>
  );
}

export function SearchEmptyState() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white">
      <div className="grid grid-cols-3 divide-x divide-[rgba(26,22,18,0.06)]">
        <div className="p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Top fetched this week</div>
          <ul className="space-y-1">
            {TOP_FETCHED.map((t) => (
              <li key={t.id} className="truncate text-[12px] text-[#1A1612]">
                · {t.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Suggested questions</div>
          <ul className="space-y-1">
            <li className="text-[12px] text-[#5A5450]">· why did we choose JWT?</li>
            <li className="text-[12px] text-[#5A5450]">· what's blocking Acme?</li>
            <li className="text-[12px] text-[#5A5450]">· who owns billing?</li>
          </ul>
        </div>
        <div className="p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A7E6F]">Recent agent activity</div>
          <ul className="space-y-1">
            {AGENT_FEED.slice(0, 3).map((f) => (
              <li key={f.id} className="truncate font-mono text-[10px] text-[#5A5450]">
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
