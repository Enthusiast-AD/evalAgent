import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 14, ...props }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 1.5 13.5 3.6v4.2c0 3.3-2.3 5.6-5.5 6.7C4.8 13.4 2.5 11.1 2.5 7.8V3.6L8 1.5Z" />
    <path d="M6 8.1 7.3 9.4 10.1 6.6" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p)}>
    <path d="M8.8 1.5 3.5 9h3.2l-.5 5.5L12 6.5H8.9l.5-5h-.6Z" />
  </svg>
);

export const IconLayers = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 1.8 14 5 8 8.2 2 5l6-3.2Z" />
    <path d="M2 8.2 8 11.4l6-3.2" />
    <path d="M2 11.4 8 14.6l6-3.2" />
  </svg>
);

export const IconPulse = (p: P) => (
  <svg {...base(p)}>
    <path d="M1.5 8h3l1.5-4.5 2.5 9 1.7-4.5h4.3" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="7" cy="7" r="4.6" />
    <path d="m10.4 10.4 3.2 3.2" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 2.8v10.4M2.8 8h10.4" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 8h11M9.5 4.5 13 8l-3.5 3.5" />
  </svg>
);

export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 3 5 5-5 5" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m10 3-5 5 5 5" />
  </svg>
);

export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m3 6 5 5 5-5" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="m3.5 3.5 9 9m0-9-9 9" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 8.5 6 12l7.5-8" />
  </svg>
);

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 4.5 12 12.5M12 3.5l-8.5 9" />
  </svg>
);

export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 1.8 14.2 13.3H1.8L8 1.8Z" />
    <path d="M8 6.2v3.4" />
    <circle cx="8" cy="11.3" r="0.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTerminal = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 3.5 6 7 2.5 10.5" />
    <path d="M7 11.5h6" />
  </svg>
);

export const IconBot = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3.5" width="8" height="6.5" rx="2" />
    <path d="M8 3.5V2M5.5 6.5h.01M10.5 6.5h.01M5.5 9.4c.9.7 4.1.7 5 0" />
    <path d="M6.5 12v1.5h3V12" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 1.5c.5 3.2 2.1 4.8 5.3 5.3-3.2.5-4.8 2.1-5.3 5.3-.5-3.2-2.1-4.8-5.3-5.3 3.2-.5 4.8-2.1 5.3-5.3Z" />
  </svg>
);

export const IconWand = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 13 10.5 5.5" />
    <path d="m8.5 2.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
    <path d="M12.5 10.5v2.8M11.1 11.9h2.8" />
  </svg>
);

export const IconLoop = (p: P) => (
  <svg {...base(p)}>
    <path d="M13 6.5A5.2 5.2 0 0 0 3.3 4.2L1.8 5.6" />
    <path d="M1.8 2.6v3h3" />
    <path d="M3 9.5A5.2 5.2 0 0 0 12.7 11.8l1.5-1.4" />
    <path d="M14.2 13.4v-3h-3" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
  </svg>
);

export const IconCode = (p: P) => (
  <svg {...base(p)}>
    <path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5l3.5 3.5-3.5 3.5" />
  </svg>
);

export const IconDatabase = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="8" cy="3.6" rx="5" ry="2.1" />
    <path d="M3 3.6v4.8c0 1.2 2.2 2.1 5 2.1s5-.9 5-2.1V3.6" />
    <path d="M3 8.4v4c0 1.2 2.2 2.1 5 2.1s5-.9 5-2.1v-4" />
  </svg>
);

export const IconArrowUp = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" />
  </svg>
);

export const IconArrowDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" />
  </svg>
);

export const IconSpinner = ({ size = 14, ...p }: P) => (
  <svg {...base({ size, ...p })} className={`animate-spin ${p.className ?? ""}`}>
    <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5" />
  </svg>
);
