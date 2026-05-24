import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "../ui/AppIcons";
import type { CalendarDayData, DeadlineItem, MeetingItem } from "../../lib/types";

type CalendarCardProps = {
  eventsByDate: Record<string, CalendarDayData>;
};

type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

const dayHeaders = ["M", "T", "W", "T", "F", "S", "S"];
const monthLabel = "APRIL 2026";
const defaultSelectedDate = "2026-04-21";

const itemVariants = {
  hidden: { opacity: 0, x: 8 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      delay: index * 0.07,
      ease: [0.22, 1, 0.36, 1] as const
    }
  })
};

const ringCircumference = 169.6;

function getDeadlineColor(status: DeadlineItem["status"]) {
  if (status === "on-track") {
    return "#B8543D";
  }

  if (status === "at-risk") {
    return "#B8543D";
  }

  return "#9E3B2E";
}

function getTypePillClasses(type: MeetingItem["type"]) {
  if (type === "standup") {
    return "text-[#B8543D] border-[#B8543D]";
  }

  if (type === "review") {
    return "text-[#B8543D] border-[#B8543D]";
  }

  if (type === "client") {
    return "text-[#5A5450] border-[#5A5450]";
  }

  return "text-[#5A5450] border-[#5A5450]";
}

function getDeadlineValue(daysLeft: number) {
  return Math.max(0, Math.min(((30 - daysLeft) / 30) * 100, 100));
}

function ScheduleColumnHeader({ label }: { label: string }) {
  return (
    <div className="mb-6">
      <p className="font-sans text-[13px] tracking-[0.16em] text-[#1A1612]">{label}</p>
      <span className="mt-2 block h-0.5 w-5 bg-[#B8543D]" />
    </div>
  );
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
  const color = getDeadlineColor(status);
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

function buildCalendarCells(): CalendarCell[] {
  const cells: CalendarCell[] = [];

  for (const day of [30, 31]) {
    cells.push({
      dateKey: `2026-03-${String(day).padStart(2, "0")}`,
      day,
      inMonth: false
    });
  }

  for (let day = 1; day <= 30; day += 1) {
    cells.push({
      dateKey: `2026-04-${String(day).padStart(2, "0")}`,
      day,
      inMonth: true
    });
  }

  for (const day of [1, 2, 3]) {
    cells.push({
      dateKey: `2026-05-${String(day).padStart(2, "0")}`,
      day,
      inMonth: false
    });
  }

  return cells;
}

export function CalendarCard({ eventsByDate }: CalendarCardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(defaultSelectedDate);

  const calendarCells = useMemo(() => buildCalendarCells(), []);
  const selectedDay = eventsByDate[selectedDate];
  const selectedEvents = selectedDay?.meetings ?? [];
  const selectedDeadlines = selectedDay?.deadlines ?? [];
  const fallbackDeadlines = useMemo(() => {
    const deadlineMap = new Map<string, DeadlineItem>();

    Object.values(eventsByDate).forEach((day) => {
      day.deadlines.forEach((deadline) => {
        deadlineMap.set(deadline.id, deadline);
      });
    });

    return Array.from(deadlineMap.values()).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [eventsByDate]);
  const displayedDeadlines = (selectedDeadlines.length > 0 ? selectedDeadlines : fallbackDeadlines).slice(0, 3);

  return (
    <motion.section
      whileHover={{
        y: -3,
        boxShadow: "none"
      }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="solid-card p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <button type="button" className="text-[#78716C]">
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <p className="font-sans text-[18px] tracking-[0.04em] text-[#1A1612]">{monthLabel}</p>
            <button type="button" className="text-[#78716C]">
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {dayHeaders.map((day, index) => (
              <div key={`${day}-${index}`} className="text-center font-sans text-[11px] tracking-[0.12em] text-[rgba(120,113,108,0.6)]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const dayData = eventsByDate[cell.dateKey];
              const hasMeeting = (dayData?.meetings.length ?? 0) > 0;
              const hasDeadline = (dayData?.deadlines.length ?? 0) > 0;
              const isToday = cell.dateKey === defaultSelectedDate;
              const isSelected = selectedDate === cell.dateKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className={[
                    "relative flex h-[38px] items-center justify-center rounded-xl transition-colors",
                    isSelected ? "bg-[#B8543D] text-white" : "",
                    !isSelected && isToday ? "bg-[#1A1612] text-white" : "",
                    !isSelected && !isToday ? "text-[#1A1612] hover:bg-[#FAF8F5]" : "",
                    !cell.inMonth ? "text-[rgba(120,113,108,0.6)]" : ""
                  ].join(" ")}
                >
                  <span className="font-sans text-[13px]">{cell.day}</span>
                  {hasMeeting || hasDeadline ? (
                    <span className="absolute bottom-[5px] flex items-center gap-1">
                      {hasMeeting ? <span className="h-1 w-1 rounded-full bg-[#B8543D]" /> : null}
                      {hasDeadline ? <span className="h-1 w-1 rounded-[1px] bg-[#B8543D]" /> : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:items-stretch">
          <div className="min-w-0">
            <ScheduleColumnHeader label="DEADLINES" />

            {displayedDeadlines.length === 0 ? (
              <p className="font-sans text-[14px] text-[#78716C]">Nothing scheduled.</p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedDate}-deadlines-${displayedDeadlines.length}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {displayedDeadlines.map((deadline, index) => (
                    <motion.div
                      key={deadline.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      className="flex items-center gap-5 border-b border-[#FAF8F5] py-5 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="mb-[3px] font-sans text-[11px] text-[#78716C]">{deadline.project}</p>
                        <p className="font-sans text-[16px] font-medium text-[#1A1612]">{deadline.task}</p>
                      </div>

                      <div className="flex-shrink-0">
                        <CircularRing
                          value={getDeadlineValue(deadline.daysLeft)}
                          daysLeft={deadline.daysLeft}
                          status={deadline.status}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="hidden w-px flex-shrink-0 self-stretch bg-white lg:block" />

          <div className="min-w-0">
            <ScheduleColumnHeader label="MEETINGS" />

            {selectedEvents.length === 0 ? (
              <p className="font-sans text-[14px] text-[#78716C]">Nothing scheduled.</p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedDate}-meetings-${selectedEvents.length}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {selectedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      className="mb-4 border-b border-[#FAF8F5] pb-4 last:mb-0 last:border-b-0 last:pb-0"
                    >
                      <p className="mb-1.5 font-mono text-[14px] font-medium text-[#1A1612]">{event.time}</p>
                      <p className="font-sans text-[16px] font-medium text-[#1A1612]">{event.title}</p>
                      <p className="mt-1 font-sans text-[12px] text-[#78716C]">{event.project}</p>

                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[rgba(26,22,18,0.08)] bg-[#FAF8F5] px-3 py-1.5 font-sans text-[11px] text-[#5A5450]">
                          {event.duration}
                        </span>
                        <span className={`rounded-full border px-3 py-1.5 font-sans text-[11px] ${getTypePillClasses(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
