import type { SVGProps } from "react";

// DailyNest brand mark — a minimalist shopping basket whose handle forms a
// leaf. Pure inline SVG so it is crisp at any size and needs no asset files.
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Basket body */}
      <path
        d="M9 19.5h30l-2.4 17.2A4 4 0 0 1 32.66 40H15.34a4 4 0 0 1-3.94-3.3L9 19.5Z"
        fill="var(--forest)"
      />
      {/* Basket weave lines */}
      <path
        d="M16 24.5v9M24 24.5v9M32 24.5v9"
        stroke="var(--ivory)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Leaf (doubles as the basket handle) */}
      <path
        d="M24 19.5c0-6.2 4.4-11.3 10.6-12.4.7 6.9-2.7 12.6-8.2 14.1"
        fill="var(--fresh)"
      />
      <path
        d="M24 19.5c0-4.6-3-8.4-7.3-9.7-.5 5.1 2 9.3 6 10.6"
        fill="var(--fresh-light)"
      />
      <path
        d="M24 19.5c.3-3.5 2.2-6.5 5.2-8.3"
        stroke="var(--forest-dark)"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Wordmark({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const titleColor = tone === "light" ? "#FFFFFF" : "var(--charcoal)";
  const subColor = tone === "light" ? "rgba(255,255,255,0.7)" : "var(--muted)";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className="font-heading text-[1.35rem] font-extrabold tracking-tight"
          style={{ color: titleColor }}
        >
          DailyNest
        </span>
        <span
          className="mt-0.5 text-[0.62rem] font-medium tracking-[0.14em] uppercase"
          style={{ color: subColor }}
        >
          Your Daily Needs
        </span>
      </span>
    </span>
  );
}
