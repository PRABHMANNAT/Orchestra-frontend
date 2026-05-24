import { motion } from "framer-motion";
import type { ReactNode } from "react";

type CardProps = {
  label: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Card({ label, action, children }: CardProps) {
  return (
    <motion.section
      whileHover={{
        y: -3,
        borderColor: "rgba(26,22,18,0.2)"
      }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="solid-card p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="font-sans text-[12px] font-medium uppercase leading-[1.3] tracking-[0.08em] text-[#78716C]">{label}</p>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
