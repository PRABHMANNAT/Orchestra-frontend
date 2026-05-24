function getRoleLabel() {
  if (typeof window === "undefined") {
    return "Manager";
  }

  const role = window.localStorage.getItem("orchestra_role");

  if (role === "dev") {
    return "Developer";
  }

  if (role === "client") {
    return "Client";
  }

  return "Manager";
}

export function SettingsPage() {
  return (
    <section className="h-full overflow-y-auto bg-bg px-8 py-10">
      <div className="mb-8">
        <p className="font-sans text-[12px] tracking-[0.18em] text-[#B8543D]">SETTINGS</p>
        <h1 className="mt-2 font-sans text-[48px] leading-none text-[#1A1612]">Workspace</h1>
        <p className="mt-2 font-sans text-[14px] text-[#78716C]">Local mock workspace preferences for the current role.</p>
      </div>

      <div className="max-w-[540px] rounded-[24px] border border-[#ecece7] bg-white p-7">
        <p className="font-sans text-[13px] tracking-[0.16em] text-[#B8543D]">ACTIVE ROLE</p>
        <p className="mt-3 font-sans text-[24px] font-medium text-[#1A1612]">{getRoleLabel()}</p>
        <p className="mt-3 font-sans text-[14px] leading-6 text-[#5A5450]">
          This shell runs on local mock data only. Use the left navigation to move between dashboard, brain, docs, and requests.
        </p>
      </div>
    </section>
  );
}
