import { AGENTS, AGENT_FEED } from "../data/mockBrainData";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AgentsRail() {
  return (
    <aside className="flex w-full flex-shrink-0 flex-col gap-6 xl:sticky xl:top-4 xl:w-[320px]">
      <div>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Brain Agents</div>
        <div className="space-y-2">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="group rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-3 transition-colors hover:border-[rgba(26,22,18,0.16)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7A8C5F]" />
                  <span className="font-serif text-[15px] text-[#1A1612]">{agent.name}</span>
                </div>
                <span className="font-mono text-[10px] text-[#A89C8A]">{timeAgo(agent.lastActive)}</span>
              </div>
              <div className="mt-1 text-[12px] leading-[1.45] text-[#5A5450]">{agent.tagline}</div>
              <div className="mt-2 rounded-[3px] bg-[#FAF8F5] px-2 py-1.5 font-mono text-[10px] text-[#5A5450]">
                {agent.activity}
              </div>
              <button className="mt-2 w-full rounded-[3px] border border-[rgba(26,22,18,0.12)] bg-white py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1A1612] transition-colors hover:bg-[#1A1612] hover:text-white">
                Invoke
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8A7E6F]">Agent Activity</div>
        <div className="rounded-[4px] border border-[rgba(26,22,18,0.08)] bg-white p-3">
          <ul className="space-y-2">
            {AGENT_FEED.map((f) => (
              <li key={f.id} className="font-mono text-[10.5px] leading-[1.5] text-[#5A5450]">
                · {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
