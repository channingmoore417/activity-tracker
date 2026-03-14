"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { isFreeDay } from "@/lib/utils/date";
import type { StreakData } from "@/lib/db/tracker";
import type { StreakHistory } from "@/lib/db/tracker-actions";
import styles from "./streak-popover.module.css";

/* ── Day status derivation ── */

type DayStatus = "hit" | "bonus" | "missed" | "free" | "future" | "today";

function getDayStatus(date: Date, history: StreakHistory): DayStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d > today) return "future";

  const key = format(d, "yyyy-MM-dd");
  const entry = history[key];

  if (entry) return entry.status;

  // No entry in history
  if (d.getTime() === today.getTime()) return "today";
  if (isFreeDay(d)) return "free";
  return "missed";
}

/* ── Day dot content ── */

function dotContent(status: DayStatus, dayNum: number) {
  switch (status) {
    case "hit":
      return <Check size={13} strokeWidth={3} />;
    case "bonus":
      return <Check size={13} strokeWidth={3} />;
    case "missed":
      return <X size={12} strokeWidth={3} />;
    case "free":
    case "future":
    case "today":
      return <span>{dayNum}</span>;
  }
}

/* ── Monday-first week helpers ── */

/** Get Monday-start week days for a given date */
function getWeekDays(today: Date): Date[] {
  // startOfWeek with weekStartsOn: 1 = Monday
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/* ── Month calendar grid (Monday-first) ── */

function getCalendarDays(month: Date): (Date | null)[] {
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  // Grid starts on Monday before (or on) the 1st
  const gridStart = startOfWeek(mStart, { weekStartsOn: 1 });
  // Grid ends on Sunday after (or on) the last day
  const gridEnd = endOfWeek(mEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return allDays.map((d) => (isSameMonth(d, month) ? d : null));
}

/* ── Component ── */

type StreakPopoverProps = {
  streak: StreakData;
  children: React.ReactNode;
};

export function StreakPopover({ streak, children }: StreakPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [calMonth, setCalMonth] = useState(() => startOfMonth(new Date()));
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!pillRef.current) return;
    const rect = pillRef.current.getBoundingClientRect();
    const top = rect.bottom + 8;
    const isMobile = window.innerWidth < 480;
    const right = isMobile ? 12 : window.innerWidth - rect.right;
    setPos({ top, right });
  }, []);

  const toggle = useCallback(() => {
    if (!open) {
      updatePosition();
      setCalMonth(startOfMonth(new Date()));
    }
    setOpen((prev) => !prev);
  }, [open, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (pillRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open, updatePosition]);

  const today = new Date();
  const weekDays = getWeekDays(today);
  const calendarDays = getCalendarDays(calMonth);
  const hasStreak = streak.currentStreak > 0;

  return (
    <>
      <button ref={pillRef} className={styles.trigger} onClick={toggle} type="button">
        {children}
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{ top: pos.top, right: pos.right }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={hasStreak ? styles.headerFlame : styles.headerFlameDim}>🔥</span>
                <span className={hasStreak ? styles.headerTitleActive : styles.headerTitle}>
                  {hasStreak
                    ? `${streak.currentStreak} Day Streak`
                    : "No Active Streak"}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} type="button">
                <X size={14} />
              </button>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
              <div className={hasStreak ? styles.statCardActive : styles.statCard}>
                <div className={hasStreak ? styles.statValueActive : styles.statValue}>
                  {streak.currentStreak}
                </div>
                <div className={styles.statLabel}>Current</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{streak.longestStreak}</div>
                <div className={styles.statLabel}>Best</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{streak.bestDayScore}</div>
                <div className={styles.statLabel}>Best Day</div>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Week Strip */}
            <div className={styles.sectionTitle}>This Week</div>
            <div className={styles.weekStrip}>
              {weekDays.map((day, idx) => {
                const status = getDayStatus(day, streak.history);
                const isWeekend = idx >= 5; // M T W T F [S S]
                const dotClass = {
                  hit: styles.dayDotHit,
                  bonus: styles.dayDotBonus,
                  missed: styles.dayDotMissed,
                  free: styles.dayDotFree,
                  future: styles.dayDotFuture,
                  today: styles.dayDotToday,
                }[status];

                return (
                  <div key={format(day, "yyyy-MM-dd")} className={styles.weekDayCol}>
                    <span className={isWeekend ? styles.weekDayLabelWeekend : styles.weekDayLabel}>
                      {WEEK_LABELS[idx]}
                    </span>
                    <div className={dotClass}>
                      {dotContent(status, day.getDate())}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Month Calendar */}
            <div className={styles.calendarHeader}>
              <button
                className={styles.calendarNav}
                onClick={() => setCalMonth((m) => addMonths(m, -1))}
                type="button"
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.calendarTitle}>
                {format(calMonth, "MMMM yyyy")}
              </span>
              <button
                className={styles.calendarNav}
                onClick={() => setCalMonth((m) => addMonths(m, 1))}
                type="button"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {/* Day-of-week headers (Mon-first) */}
              {WEEK_LABELS.map((label, idx) => {
                const isWeekend = idx >= 5;
                return (
                  <div
                    key={`hdr-${idx}`}
                    className={isWeekend ? styles.calendarDayHeaderWeekend : styles.calendarDayHeader}
                  >
                    {label}
                  </div>
                );
              })}

              {/* Calendar cells */}
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return (
                    <div key={`empty-${idx}`} className={styles.calendarCell}>
                      <div className={styles.calDotEmpty} />
                    </div>
                  );
                }

                const status = getDayStatus(day, streak.history);
                const isToday = isSameDay(day, today);
                const dotClass = {
                  hit: styles.calDotHit,
                  bonus: styles.calDotBonus,
                  missed: styles.calDotMissed,
                  free: styles.calDotFree,
                  future: styles.calDotFuture,
                  today: styles.calDotToday,
                }[status];

                return (
                  <div key={format(day, "yyyy-MM-dd")} className={styles.calendarCell}>
                    <div className={dotClass}>
                      {(status === "hit" || status === "bonus") ? (
                        <Check size={10} strokeWidth={3} />
                      ) : status === "missed" ? (
                        <X size={9} strokeWidth={3} />
                      ) : (
                        <span>{day.getDate()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={styles.legendDotHit} />
                Hit
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDotBonus} />
                Bonus
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDotMissed} />
                Missed
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDotFree} />
                Free
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDotFuture} />
                Future
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
