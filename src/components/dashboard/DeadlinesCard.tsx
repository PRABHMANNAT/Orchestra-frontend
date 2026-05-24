import { motion } from "framer-motion";
import type { DeadlineItem } from "../../lib/types";
import { Card } from "../ui/Card";

type DeadlinesCardProps = {
  deadlines: DeadlineItem[];
};

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const ringCircumference = 169.6;

function getStatusColor(status: DeadlineItem["status"]) {
  if (status === "on-track") {
    return "#B8543D";
  }

  if (status === "at-risk") {
    return "#B8543D";
  }

  return "#9E3B2E";
}

function getDeadlineValue(daysLeft: number) {
  return Math.max(0, Math.min(((30 - daysLeft) / 30) * 100, 100));
}

function CircularRing({
  value,
  daysLeft,
  status
}: {
  value: number;
  daysLeft: number;
  status: DeadlineItem["status"];
}) {
  const color = getStatusColor(status);
  const strokeDashoffset = ringCircumference * (1 - value / 100);

  return (
    <div className="relative h-16 w-16">
      <svg width="64" height="64" viewBox="0 0 64 64" className="block">
        <circle cx="32" cy="32" r="27" fill="none" stroke="#FAF8F5" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          initial={{ strokeDashoffset: ringCircumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 32 32)"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-[1px]">
        <span className="font-sans text-[16px] leading-none" style={{ color }}>
          {daysLeft}
        </span>
        <span className="mt-0.5 font-sans text-[9px] leading-none text-[rgba(120,113,108,0.6)]">D</span>
      </div>
    </div>
  );
}

export function DeadlinesCard({ deadlines }: DeadlinesCardProps) {
  const visibleDeadlines = deadlines.slice(0, 3);
  const thisWeekCount = visibleDeadlines.filter((item) => item.daysLeft <= 7).length;

  return (
    <Card
      label="DEADLINES"
      action={<span className="font-mono text-[11px] text-teal">{thisWeekCount} THIS WEEK</span>}
    >
      <motion.div initial="hidden" animate="visible" variants={listVariants}>
        {visibleDeadlines.map((item) => {
          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="flex items-center gap-5 border-b border-[#FAF8F5] py-5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-[3px] font-sans text-[11px] text-[#78716C]">{item.project}</p>
                <p className="font-sans text-[16px] font-medium text-[#1A1612]">{item.task}</p>
              </div>

              <div className="flex-shrink-0">
                <CircularRing value={getDeadlineValue(item.daysLeft)} daysLeft={item.daysLeft} status={item.status} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
