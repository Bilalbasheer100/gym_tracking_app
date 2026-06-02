"use client";
import { addDays, prettyDate, todayStr } from "@/lib/date";

export default function DateNav({ date, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button
        aria-label="Previous day"
        className="btn-ghost h-10 w-10 !px-0"
        onClick={() => onChange(addDays(date, -1))}
      >
        ‹
      </button>
      <div className="flex flex-col items-center">
        <span className="text-base font-semibold">{prettyDate(date)}</span>
        {date !== todayStr() && (
          <button className="text-[11px] text-accent" onClick={() => onChange(todayStr())}>
            jump to today
          </button>
        )}
      </div>
      <button
        aria-label="Next day"
        className="btn-ghost h-10 w-10 !px-0"
        onClick={() => onChange(addDays(date, 1))}
      >
        ›
      </button>
    </div>
  );
}
