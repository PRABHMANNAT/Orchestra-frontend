import { motion } from "framer-motion";
import type { RequestItem } from "../../lib/types";
import { Card } from "../ui/Card";

type RecentRequestsCardProps = {
  requests: RequestItem[];
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

function getPlatformTone(platform: RequestItem["platform"]) {
  if (platform === "slack") {
    return { background: "#5A5450", label: "S" };
  }

  if (platform === "email") {
    return { background: "#5A5450", label: "G" };
  }

  return { background: "#5A5450", label: "W" };
}

function getStatusTone(status: RequestItem["status"]) {
  if (status === "pending") {
    return "border-[#B8543D] bg-[rgba(194,136,64,0.12)] text-[#B8543D]";
  }

  return "border-[#B8543D] bg-[rgba(45,74,62,0.10)] text-[#B8543D]";
}

export function RecentRequestsCard({ requests }: RecentRequestsCardProps) {
  const pendingCount = requests.filter((item) => item.status === "pending").length;

  return (
    <Card
      label="RECENT REQUESTS"
      action={
        <span className="rounded-full bg-[rgba(194,136,64,0.12)] px-3 py-1 font-sans text-[11px] tracking-[0.14em] text-[#B8543D]">
          {pendingCount} PENDING
        </span>
      }
    >
      <motion.div initial="hidden" animate="visible" variants={listVariants}>
        {requests.map((item) => {
          const platformTone = getPlatformTone(item.platform);

          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="flex items-start gap-4 border-b border-[#FAF8F5] py-4 last:border-b-0 last:pb-0 first:pt-0"
            >
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-sans text-[14px] text-white"
                style={{ backgroundColor: platformTone.background }}
              >
                {platformTone.label}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-sans text-[12px] text-[#78716C]">{item.from}</p>
                <p className="mt-0.5 line-clamp-2 font-sans text-[14px] font-medium text-[#1A1612]">{item.message}</p>
              </div>

              <div className="w-[94px] flex-shrink-0 text-right">
                <p className="font-mono text-[11px] text-[#78716C]">{item.time}</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 font-sans text-[10px] tracking-[0.14em] ${getStatusTone(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
