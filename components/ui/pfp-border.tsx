import { cn } from "@/lib/utils";

interface PfpBorderProps {
  className?: string;
}

export function PfpBorder({ className }: PfpBorderProps) {
  return (
    <svg
      className={cn("h-full w-full", className)}
      viewBox="0 0 601 601"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="pfp-border-gradient"
          x1="-150.3"
          y1="736.9"
          x2="1592.4"
          y2="-488.6"
          gradientTransform="translate(114.9 801.2) scale(1 -1)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#b8cfec" />
          <stop offset=".2" stopColor="#eff5e2" />
          <stop offset=".3" stopColor="#e3cee4" />
          <stop offset=".4" stopColor="#d9c0dd" />
          <stop offset=".6" stopColor="#c2d0eb" />
          <stop offset=".7" stopColor="#fafdff" />
          <stop offset=".8" stopColor="#bbe3e1" />
          <stop offset="1" stopColor="#7d6bb0" />
        </linearGradient>
      </defs>
      <path
        className="fill-none"
        stroke="url(#pfp-border-gradient)"
        strokeWidth="21"
        d="M300.5,10.5c160.2,0,290,129.8,290,290s-129.8,290-290,290S10.5,460.7,10.5,300.5,140.3,10.5,300.5,10.5Z"
      />
    </svg>
  );
}
