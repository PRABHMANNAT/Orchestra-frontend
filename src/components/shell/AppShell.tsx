import { motion } from "framer-motion";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavBar } from "./NavBar";
import { SocratesPanel } from "./SocratesPanel";

const navTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
} as const;

export function AppShell() {
  const [navExpanded, setNavExpanded] = useState(false);
  const location = useLocation();
  const isBrainRoute = location.pathname.includes("/brain");
  const isInfoRoute = /\/projects\/[^/]+\/info$/.test(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <NavBar expanded={navExpanded} onExpandedChange={setNavExpanded} />
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ width: navExpanded ? 200 : 56 }}
        transition={navTransition}
        className="h-screen flex-shrink-0"
      />
      {isBrainRoute || isInfoRoute ? null : <SocratesPanel />}
      <main className="min-w-0 flex-1 overflow-hidden bg-bg">
        <Outlet />
      </main>
    </div>
  );
}
