import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../components/ui/Avatar";
import { AlertCircleIcon, ArrowRightIcon, CodeIcon, GitPullRequestIcon, UsersIcon } from "../components/ui/AppIcons";
import { getCodebaseOverview } from "../lib/api";
import type { CodebaseOverviewPayload, CodebaseRepo } from "../lib/types";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const } }
} as const;

function projectHref(projectId: string, href: string) {
  if (href.startsWith("/projects/")) {
    return href;
  }

  return `/projects/${projectId}${href}`;
}

function statusClass(status: "accepted" | "contested") {
  return status === "accepted"
    ? "border-[rgba(26,22,18,0.08)] bg-white text-[#5A5450]"
    : "border-[#B8543D] bg-[rgba(184,84,61,0.06)] text-[#B8543D]";
}

function busFactorLabel(value: "shared" | "thin" | "single") {
  if (value === "single") {
    return "single effective owner";
  }

  if (value === "thin") {
    return "thin coverage";
  }

  return "shared";
}

function RepoCard({ repo, projectId }: { repo: CodebaseRepo; projectId: string }) {
  return (
    <motion.article variants={itemVariants} className="rounded-[8px] border border-[rgba(26,22,18,0.08)] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[13px] text-[#1A1612]">{repo.name}</p>
          <p className="mt-2 font-sans text-[14px] leading-6 text-[#5A5450]">{repo.purpose}</p>
        </div>
        <CodeIcon className="h-5 w-5 flex-shrink-0 text-[#78716C]" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] text-[#78716C]">
        <span className="rounded-full border border-[rgba(26,22,18,0.08)] px-2.5 py-1">{repo.language}</span>
        <span className="rounded-full border border-[rgba(26,22,18,0.08)] px-2.5 py-1">{repo.size}</span>
        <span className="rounded-full border border-[rgba(26,22,18,0.08)] px-2.5 py-1">{repo.lastActive}</span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[rgba(26,22,18,0.08)] pt-4">
        <div className="flex -space-x-2">
          {repo.owners.map((owner) => (
            <Avatar key={owner} seed={owner} name={owner} size={28} />
          ))}
        </div>
        <Link
          to={`/projects/${projectId}/overview/repos/${repo.id}`}
          className="inline-flex items-center gap-1 font-sans text-[12px] text-[#B8543D]"
        >
          Repo detail <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}

function RepoDetail({ repo, projectId }: { repo: CodebaseRepo; projectId: string }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[8px] border border-[rgba(26,22,18,0.08)] bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[13px] text-[#1A1612]">{repo.name}</p>
        <Link to={`/projects/${projectId}/overview`} className="font-sans text-[12px] text-[#78716C] hover:text-[#1A1612]">
          Close
        </Link>
      </div>
      <p className="mt-3 font-sans text-[14px] leading-6 text-[#5A5450]">{repo.detail}</p>
      <p className="mt-5 font-sans text-[11px] tracking-[0.16em] text-[#78716C]">KEY PATHS</p>
      <div className="mt-3 space-y-2">
        {repo.paths.map((path) => (
          <div key={path} className="rounded-[8px] border border-[rgba(26,22,18,0.08)] px-3 py-2 font-mono text-[11px] text-[#5A5450]">
            {path}
          </div>
        ))}
      </div>
    </motion.aside>
  );
}

export function CodebaseOverviewPage() {
  const { id = "1", repoId } = useParams();
  const [overview, setOverview] = useState<CodebaseOverviewPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const payload = await getCodebaseOverview(id);
      if (!cancelled) {
        setOverview(payload);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedRepo = useMemo(() => overview?.repos.find((repo) => repo.id === repoId) ?? null, [overview, repoId]);

  if (!overview) {
    return <section className="h-full bg-bg" />;
  }

  return (
    <section className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto max-w-[1180px] px-10 py-10">
        <header className="mb-10">
          <p className="font-mono text-[12px] text-[#78716C]">NORTHSTAR-CODEBASE · ORIENTATION</p>
          <h1 className="mt-3 font-sans text-[48px] leading-none text-[#1A1612]">Codebase overview</h1>
          <p className="mt-4 max-w-[680px] font-sans text-[15px] leading-7 text-[#78716C]">
            Repos, ownership, decisions, and open questions for a thirty-second lay of the land.
          </p>
        </header>

        <div className={selectedRepo ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}>
          <div className="space-y-12">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-sans text-[13px] tracking-[0.18em] text-[#1A1612]">REPOS</h2>
                <span className="font-mono text-[11px] text-[#78716C]">{overview.repos.length} active</span>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
                {overview.repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} projectId={id} />
                ))}
              </motion.div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-[#78716C]" />
                <h2 className="font-sans text-[13px] tracking-[0.18em] text-[#1A1612]">OWNERSHIP</h2>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-3">
                {overview.owners.map((owner) => (
                  <motion.article
                    key={owner.id}
                    variants={itemVariants}
                    className="grid gap-4 rounded-[8px] border border-[rgba(26,22,18,0.08)] bg-white p-4 md:grid-cols-[220px_minmax(0,1fr)_auto]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar seed={owner.name} name={owner.name} size={34} />
                      <span>
                        <span className="block font-sans text-[14px] text-[#1A1612]">{owner.name}</span>
                        <span className="block font-sans text-[12px] text-[#78716C]">{owner.role} · {owner.area}</span>
                      </span>
                    </div>
                    <p className="font-sans text-[13px] leading-6 text-[#5A5450]">{owner.owns.join(" · ")}</p>
                    <span className="self-start rounded-full border border-[rgba(26,22,18,0.08)] px-2.5 py-1 font-mono text-[10px] text-[#78716C]">
                      {busFactorLabel(owner.busFactor)}
                    </span>
                  </motion.article>
                ))}
              </motion.div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <GitPullRequestIcon className="h-4 w-4 text-[#78716C]" />
                <h2 className="font-sans text-[13px] tracking-[0.18em] text-[#1A1612]">KEY DECISIONS</h2>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-3">
                {overview.decisions.map((decision) => (
                  <motion.article key={decision.id} variants={itemVariants} className="rounded-[8px] border border-[rgba(26,22,18,0.08)] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-[15px] text-[#1A1612]">{decision.title}</p>
                        <p className="mt-2 font-sans text-[13px] leading-6 text-[#5A5450]">{decision.summary}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${statusClass(decision.status)}`}>{decision.status}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[rgba(26,22,18,0.08)] pt-3">
                      <span className="font-mono text-[11px] text-[#78716C]">{decision.reference}</span>
                      <Link to={projectHref(id, decision.traceHref)} className="font-sans text-[12px] text-[#B8543D]">
                        Trace →
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4 text-[#B8543D]" />
                <h2 className="font-sans text-[13px] tracking-[0.18em] text-[#1A1612]">ACTIVE / CONTESTED</h2>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-3">
                {overview.questions.map((question) => {
                  const owner = overview.owners.find((item) => item.id === question.ownerId);

                  return (
                    <motion.article key={question.id} variants={itemVariants} className="rounded-[8px] border border-[rgba(184,84,61,0.28)] bg-white p-4">
                      <p className="font-sans text-[15px] text-[#1A1612]">{question.title}</p>
                      <p className="mt-2 font-sans text-[13px] leading-6 text-[#5A5450]">{question.impact}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(26,22,18,0.08)] pt-3">
                        <span className="font-mono text-[11px] text-[#78716C]">{question.source}</span>
                        <div className="flex items-center gap-3">
                          {owner ? (
                            <span className="font-sans text-[12px] text-[#5A5450]">
                              {owner.name}
                            </span>
                          ) : null}
                          <Link to={projectHref(id, question.traceHref)} className="font-sans text-[12px] text-[#B8543D]">
                            Trace →
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            </section>
          </div>

          {selectedRepo ? <RepoDetail repo={selectedRepo} projectId={id} /> : null}
        </div>
      </div>
    </section>
  );
}
