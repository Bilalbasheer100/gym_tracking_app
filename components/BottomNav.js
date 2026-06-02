"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/food", label: "Food", icon: FoodIcon },
  { href: "/workout", label: "Lift", icon: LiftIcon },
  { href: "/weight", label: "Body", icon: BodyIcon },
  { href: "/settings", label: "Goals", icon: GoalsIcon },
];

export default function BottomNav() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-xl items-stretch justify-around"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function base(active) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2.4 : 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
}

function HomeIcon({ active }) {
  return (
    <svg {...base(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function FoodIcon({ active }) {
  return (
    <svg {...base(active)}>
      <path d="M5 3v8a3 3 0 0 0 6 0V3" />
      <path d="M8 3v18" />
      <path d="M17 3c-1.5 1-2.5 3-2.5 5.5S15.5 13 17 14v7" />
    </svg>
  );
}
function LiftIcon({ active }) {
  return (
    <svg {...base(active)}>
      <path d="M6.5 6.5v11M17.5 6.5v11" />
      <path d="M3.5 9v6M20.5 9v6" />
      <path d="M6.5 12h11" />
    </svg>
  );
}
function BodyIcon({ active }) {
  return (
    <svg {...base(active)}>
      <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 9v4l2.5 1.5" />
    </svg>
  );
}
function GoalsIcon({ active }) {
  return (
    <svg {...base(active)}>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}
