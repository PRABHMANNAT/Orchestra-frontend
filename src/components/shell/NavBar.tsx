import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import {
  AlertCircleIcon,
  CodeIcon,
  FileDescriptionIcon,
  GitBranchIcon,
  SettingsIcon,
  SparklesIcon
} from "../ui/AppIcons";

type NavBarProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

function SocratesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontFamily="Fraunces, ui-serif, Georgia, serif"
        fontSize="12.5"
        fontWeight="500"
        fill="currentColor"
      >
        Σ
      </text>
    </svg>
  );
}

type NavItem =
  | {
      key: string;
      kind?: "item";
      label: string;
      icon: ReactNode;
      route: string;
      active: boolean;
    }
  | {
      key: string;
      kind: "divider";
    };

const navTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
} as const;

const viewerByRole = {
  manager: { initials: "SC", label: "Manager", seed: "Sarah Chen" },
  dev: { initials: "MT", label: "Developer", seed: "Marcus Thompson" },
  client: { initials: "LF", label: "Client", seed: "Lisa Foster" }
} as const;

function getCurrentRole() {
  if (typeof window === "undefined") {
    return "manager";
  }

  const storedRole = window.localStorage.getItem("orchestra_role");
  if (storedRole === "dev" || storedRole === "client") {
    return storedRole;
  }

  return "manager";
}

function labelAnimation(expanded: boolean) {
  return {
    opacity: expanded ? 1 : 0,
    x: expanded ? 0 : -4,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const }
  };
}

function NavItemButton({ item, expanded, onClick }: { item: Extract<NavItem, { kind?: "item" }>; expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={item.label}
      onClick={onClick}
      className={[
        "relative flex h-11 w-full items-center gap-[14px] px-[14px] text-left transition-colors",
        item.active ? "bg-[rgba(184,84,61,0.08)]" : "hover:bg-[#FAF8F5]"
      ].join(" ")}
    >
      {item.active ? <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#B8543D]" /> : null}

      <span className={item.active ? "text-[#B8543D]" : "text-[#78716C]"}>{item.icon}</span>
      <motion.span animate={labelAnimation(expanded)} className="whitespace-nowrap font-sans text-[13px] text-[#1A1612]">
        {item.label}
      </motion.span>
    </button>
  );
}

export function NavBar({ expanded, onExpandedChange }: NavBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = getCurrentRole();
  const viewer = viewerByRole[role];

  const currentProjectId = useMemo(() => {
    const matchedProject = pathname.match(/^\/projects\/([^/]+)/);
    return matchedProject?.[1] ?? "1";
  }, [pathname]);

  const isProjectRoute = pathname.startsWith("/projects/");

  const generalItems: NavItem[] = [
    {
      key: "socrates",
      label: "SOCRATES",
      icon: <SocratesIcon />,
      route: `/projects/${currentProjectId}/socrates`,
      active: /^\/projects\/[^/]+\/socrates$/.test(pathname)
    },
    {
      key: "brain",
      label: "BRAIN",
      icon: <SparklesIcon />,
      route: `/projects/${currentProjectId}/brain`,
      active: /^\/projects\/[^/]+\/brain$/.test(pathname)
    },
    {
      key: "flow",
      label: "Flow",
      icon: <GitBranchIcon />,
      route: `/projects/${currentProjectId}/flow`,
      active: /^\/projects\/[^/]+\/flow$/.test(pathname)
    },
    {
      key: "live-doc",
      label: "LIVE DOC",
      icon: <FileDescriptionIcon />,
      route: `/projects/${currentProjectId}/live-doc`,
      active: /^\/projects\/[^/]+\/live-doc$/.test(pathname)
    },
    {
      key: "company-brain",
      label: "COMPANY BRAIN",
      icon: <SparklesIcon />,
      route: "/company-brain",
      active: pathname.startsWith("/company-brain")
    },
    {
      key: "settings",
      label: "SETTINGS",
      icon: <SettingsIcon />,
      route: "/settings",
      active: pathname === "/settings"
    }
  ];

  const projectItems: NavItem[] = [
    {
      key: "socrates",
      label: "SOCRATES",
      icon: <SocratesIcon />,
      route: `/projects/${currentProjectId}/socrates`,
      active: new RegExp(`^/projects/${currentProjectId}/socrates$`).test(pathname)
    },
    {
      key: "brain",
      label: "BRAIN",
      icon: <SparklesIcon />,
      route: `/projects/${currentProjectId}/brain`,
      active: new RegExp(`^/projects/${currentProjectId}/brain$`).test(pathname)
    },
    {
      key: "info",
      label: "INFO",
      icon: <AlertCircleIcon />,
      route: `/projects/${currentProjectId}/info`,
      active: new RegExp(`^/projects/${currentProjectId}/info$`).test(pathname)
    },
    {
      key: "codebase",
      label: "CODEBASE",
      icon: <CodeIcon />,
      route: `/projects/${currentProjectId}/overview`,
      active: new RegExp(`^/projects/${currentProjectId}/overview(?:/.*)?$`).test(pathname)
    },
    {
      key: "live-doc",
      label: "LIVE DOCS",
      icon: <FileDescriptionIcon />,
      route: `/projects/${currentProjectId}/live-doc`,
      active: new RegExp(`^/projects/${currentProjectId}/live-doc$`).test(pathname)
    },
    {
      key: "flowchart",
      label: "FLOWCHART",
      icon: <GitBranchIcon />,
      route: `/projects/${currentProjectId}/flow`,
      active: new RegExp(`^/projects/${currentProjectId}/flow$`).test(pathname)
    }
  ];

  const items = isProjectRoute ? projectItems : generalItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 200 : 56 }}
      transition={navTransition}
      onHoverStart={() => onExpandedChange(true)}
      onHoverEnd={() => onExpandedChange(false)}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-[rgba(26,22,18,0.08)] bg-white"
    >
      <div className="flex h-16 items-center px-[14px]">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#B8543D]">
          <span className="font-sans text-[16px] leading-none text-white">O</span>
        </div>

        <motion.span animate={labelAnimation(expanded)} className="ml-[10px] whitespace-nowrap font-sans text-[15px] text-[#1A1612]">
          ORCHESTRA
        </motion.span>
      </div>

      <div className="flex-1 pt-2">
        {items.map((item) => {
          if (item.kind === "divider") {
            return <div key={item.key} className="mx-[22px] my-2 h-px bg-[rgba(26,22,18,0.08)]" />;
          }

          return <NavItemButton key={item.key} item={item} expanded={expanded} onClick={() => navigate(item.route)} />;
        })}
      </div>

      <div className="mb-4 px-[14px]">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar seed={viewer.seed} size={28} name={viewer.seed} role={viewer.label} />
          </div>

          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="ml-[10px] whitespace-nowrap font-sans text-[11px] text-[#78716C]"
              >
                {viewer.label}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
