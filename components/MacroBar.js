"use client";
import { round } from "@/lib/api";

export default function MacroBar({ label, value = 0, goal = 0, color = "#4f8cff", unit = "g" }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const left = Math.max(goal - value, 0);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
        <span className="text-muted">
          <span className="text-white/90 font-semibold">{round(value)}</span>
          {goal > 0 ? ` / ${round(goal)}${unit}` : unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {goal > 0 && (
        <div className="mt-1 text-[11px] text-muted">{round(left)}{unit} left</div>
      )}
    </div>
  );
}
