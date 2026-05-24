import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TbCheck,
  TbEye,
  TbLock,
  TbPlus,
  TbRobot,
  TbShield,
  TbTrash,
  TbUserCheck,
  TbUsers,
  TbX
} from "react-icons/tb";
import { BrainShell, BrainTopBar } from "../features/company-brain/components/BrainShell";
import { DocMiniRef, PersonDisc } from "../features/company-brain/components/BrainBits";
import {
  DEFAULT_PERMISSIONS,
  DOCS,
  HAIR,
  INK,
  MUTED,
  PEOPLE,
  PURPLE,
  RUST,
  TEAL,
  docById,
  personById
} from "../features/company-brain/data";
import type { PermissionsMatrixRow } from "../features/company-brain/types";

type Col = "view" | "useInAgentContext" | "editMetadata" | "delete";
const COLS: { key: Col; label: string; icon: React.ReactNode }[] = [
  { key: "view", label: "View", icon: <TbEye className="h-3 w-3" strokeWidth={1.5} /> },
  { key: "useInAgentContext", label: "Agent context", icon: <TbRobot className="h-3 w-3" strokeWidth={1.5} /> },
  { key: "editMetadata", label: "Edit metadata", icon: <TbShield className="h-3 w-3" strokeWidth={1.5} /> },
  { key: "delete", label: "Delete", icon: <TbTrash className="h-3 w-3" strokeWidth={1.5} /> }
];

export default function CompanyBrainPermissionsPage() {
  const [docId, setDocId] = useState(DOCS[0].id);
  const [rows, setRows] = useState<PermissionsMatrixRow[]>(DEFAULT_PERMISSIONS);
  const [allowAgents, setAllowAgents] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [previewId, setPreviewId] = useState("kartikeya");
  const [autocomplete, setAutocomplete] = useState("");

  const doc = docById(docId)!;
  const previewPerson = personById(previewId);

  const previewRow = rows.find((r) => r.id === `person-${previewId}`) ?? rows.find((r) => r.kind === "team" && r.name === "Engineering");
  const canSee = previewRow?.permissions.view ?? false;

  const candidates = useMemo(() => {
    const q = autocomplete.trim().toLowerCase();
    if (!q) return [];
    const ppl = PEOPLE.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ id: `person-${p.id}`, kind: "person" as const, name: p.name }));
    const teams = ["Engineering", "Product", "Design", "GTM"].filter((t) => t.toLowerCase().includes(q)).map((t) => ({ id: `team-${t}`, kind: "team" as const, name: t }));
    const roles = ["Platform engineering", "Frontend", "Backend", "Contractors"].filter((t) => t.toLowerCase().includes(q)).map((t) => ({ id: `role-${t}`, kind: "role" as const, name: t }));
    return [...ppl, ...teams, ...roles].slice(0, 6);
  }, [autocomplete]);

  const addRow = (id: string, name: string, kind: PermissionsMatrixRow["kind"]) => {
    if (rows.find((r) => r.id === id)) return;
    setRows((s) => [
      ...s,
      { id, kind, name, permissions: { view: true, useInAgentContext: false, editMetadata: false, delete: false } }
    ]);
    setAutocomplete("");
  };

  const togglePerm = (rowId: string, col: Col) => {
    setRows((s) =>
      s.map((r) => (r.id === rowId ? { ...r, permissions: { ...r.permissions, [col]: !r.permissions[col] } } : r))
    );
  };

  const removeRow = (rowId: string) => setRows((s) => s.filter((r) => r.id !== rowId));

  return (
    <BrainShell
      topBar={
        <BrainTopBar
          breadcrumb={[{ label: "Company Brain", href: "/company-brain" }, { label: "Permissions" }]}
          title="Permissions"
        />
      }
    >
      <div className="mx-auto max-w-[1100px] px-6 py-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: MUTED }}>
              SCOPE
            </p>
            <div className="mt-1 flex items-center gap-2">
              <select
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="rounded-[6px] border bg-white px-2 py-1.5 font-sans text-[13px]"
                style={{ borderColor: HAIR, color: INK }}
              >
                {DOCS.slice(0, 10).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
              <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                or apply to a collection
              </span>
            </div>
          </div>
          <DocMiniRef docId={doc.id} />
        </header>

        {/* matrix */}
        <section className="rounded-[8px] border bg-white" style={{ borderColor: HAIR }}>
          <header className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: HAIR }}>
            <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
              ACCESS MATRIX
            </p>
            <div className="relative">
              <input
                value={autocomplete}
                onChange={(e) => setAutocomplete(e.target.value)}
                placeholder="add person, team, or role…"
                className="w-[260px] rounded-[6px] border bg-white py-1 pl-2 pr-2 font-mono text-[11px] outline-none"
                style={{ borderColor: HAIR, color: INK }}
              />
              {candidates.length > 0 ? (
                <ul
                  className="absolute right-0 top-[calc(100%+4px)] z-20 w-[260px] rounded-[6px] border bg-white p-1 shadow-[0_6px_24px_rgba(26,22,18,0.08)]"
                  style={{ borderColor: HAIR }}
                >
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => addRow(c.id, c.name, c.kind)}
                        className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left hover:bg-[#FAF8F5]"
                      >
                        {c.kind === "person" ? <TbUserCheck className="h-3 w-3" strokeWidth={1.5} /> : c.kind === "team" ? <TbUsers className="h-3 w-3" strokeWidth={1.5} /> : <TbShield className="h-3 w-3" strokeWidth={1.5} />}
                        <span className="font-sans text-[12px]" style={{ color: INK }}>
                          {c.name}
                        </span>
                        <span className="ml-auto font-mono text-[10px]" style={{ color: MUTED }}>
                          {c.kind}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </header>

          <table className="w-full">
            <thead>
              <tr style={{ background: "#FBF7F1" }}>
                <th className="px-4 py-2 text-left font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
                  WHO
                </th>
                {COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-center font-mono text-[10px] tracking-[0.16em]" style={{ color: MUTED }}>
                    <span className="inline-flex items-center gap-1">
                      {c.icon}
                      {c.label.toUpperCase()}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} style={{ borderTop: `1px solid ${HAIR}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.kind === "person" ? (
                        <PersonDisc person={personById(row.id.replace("person-", ""))} size={20} />
                      ) : (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "#F1ECE4", color: MUTED }}>
                          {row.kind === "team" ? <TbUsers className="h-3 w-3" strokeWidth={1.5} /> : <TbShield className="h-3 w-3" strokeWidth={1.5} />}
                        </span>
                      )}
                      <span className="font-sans text-[13px]" style={{ color: INK }}>
                        {row.name}
                      </span>
                      <span className="rounded-full bg-[#F1ECE4] px-1.5 py-0.5 font-mono text-[9px]" style={{ color: MUTED }}>
                        {row.kind}
                      </span>
                    </div>
                  </td>
                  {COLS.map((c) => {
                    const on = row.permissions[c.key];
                    return (
                      <td key={c.key} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePerm(row.id, c.key)}
                          aria-pressed={on}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] border"
                          style={{
                            background: on ? `${TEAL}14` : "transparent",
                            borderColor: on ? `${TEAL}55` : HAIR,
                            color: on ? TEAL : MUTED
                          }}
                        >
                          {on ? <TbCheck className="h-3 w-3" strokeWidth={2} /> : null}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="rounded-[6px] p-1 hover:bg-[#FAF8F5]"
                      style={{ color: MUTED }}
                      title="remove"
                    >
                      <TbX className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <section className="rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
              AGENT ACCESS
            </p>
            <ToggleRow
              checked={allowAgents}
              onChange={setAllowAgents}
              title="Allow AI agents to use this document"
              hint="Separate from human read access — agents are subject to their own switch."
            />
            <ToggleRow
              checked={requireApproval}
              onChange={setRequireApproval}
              title="Require approval before agent fetches"
              hint="Sensitive docs require a one-tap approval from the owner before any agent fetch."
            />
          </section>

          <section className="rounded-[8px] border bg-white p-4" style={{ borderColor: HAIR }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: MUTED }}>
                WHAT THEY'D SEE
              </p>
              <select
                value={previewId}
                onChange={(e) => setPreviewId(e.target.value)}
                className="rounded-[6px] border bg-white px-1.5 py-0.5 font-sans text-[12px]"
                style={{ borderColor: HAIR, color: INK }}
              >
                {PEOPLE.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[6px] border p-3" style={{ borderColor: HAIR, background: "#FBF7F1" }}>
              <div className="flex items-center gap-2">
                <PersonDisc person={previewPerson} size={20} />
                <p className="font-sans text-[13px]" style={{ color: INK }}>
                  {previewPerson?.name}
                </p>
              </div>
              {canSee ? (
                <div className="mt-2">
                  <p className="font-sans text-[13px]" style={{ color: INK }}>
                    {doc.title}
                  </p>
                  <p className="mt-1 font-sans text-[12px] leading-5" style={{ color: MUTED }}>
                    {doc.summary}
                  </p>
                  <p className="mt-2 font-mono text-[10px]" style={{ color: MUTED }}>
                    (sensitive sections — board financials — redacted automatically for this viewer)
                  </p>
                </div>
              ) : (
                <p className="mt-2 font-sans text-[13px]" style={{ color: RUST }}>
                  <TbLock className="mr-1 inline h-3 w-3" strokeWidth={1.5} />
                  Access denied. {previewPerson?.name} cannot see this document.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-6 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: HAIR }}>
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            changes apply on save · audit-logged
          </p>
          <button
            type="button"
            className="rounded-[6px] px-4 py-1.5 font-sans text-[12px] text-white"
            style={{ background: RUST }}
          >
            save permissions
          </button>
        </footer>
      </div>
    </BrainShell>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  hint
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="font-sans text-[13px]" style={{ color: INK }}>
          {title}
        </p>
        <p className="mt-0.5 font-sans text-[12px]" style={{ color: MUTED }}>
          {hint}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative mt-1 inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full"
        style={{ background: checked ? RUST : "#D9CFC3" }}
      >
        <motion.span
          animate={{ x: checked ? 14 : 2 }}
          transition={{ duration: 0.18 }}
          className="inline-block h-3 w-3 rounded-full bg-white"
        />
      </button>
    </div>
  );
}
