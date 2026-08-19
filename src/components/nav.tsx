"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLayers, IconPulse, IconPlus, IconShield, IconTerminal } from "./icons";

export function Nav() {
  const pathname = usePathname();

  const link = (href: string, label: string, icon: React.ReactNode) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] font-medium transition-colors duration-140 ${
          active ? "bg-white/[0.06] text-white" : "text-[var(--text-dim)] hover:text-white hover:bg-white/[0.04]"
        }`}
      >
        <span className={active ? "text-[var(--accent-soft)]" : ""}>{icon}</span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-[218px] shrink-0 border-r border-[var(--line)] bg-[var(--bg-elev)] flex flex-col sticky top-0 h-screen">
      <div className="h-14 flex items-center gap-2.5 px-4">
        <div className="w-6 h-6 rounded-[7px] bg-gradient-to-b from-[#6f79f7] to-[#4a54d8] flex items-center justify-center shadow-[0_0_16px_-2px_rgba(110,120,255,0.5)]">
          <IconShield size={13} className="text-white" />
        </div>
        <span className="text-[14px] font-semibold tracking-[-0.01em]">AgentGuard</span>
        <span className="ml-auto text-[10px] font-medium text-[var(--text-faint)] mono">v0.4</span>
      </div>

      <div className="px-3 pt-1 flex-1 space-y-0.5">
        {link("/", "Agents", <IconLayers size={15} />)}
        {link("/runs", "Scans", <IconPulse size={15} />)}
        <div className="pt-4 px-2.5 pb-1.5">
          <span className="label">Docs</span>
        </div>
        {link("/pipeline", "Pipeline", <IconTerminal size={15} />)}
      </div>

      <div className="p-3 border-t border-[var(--line)]">
        <div className="panel px-3 py-2.5 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--ok)] opacity-40 animate-ping [animation-duration:2.4s]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-medium text-white">Engine online</div>
            <div className="text-[10px] text-[var(--text-faint)] mono">sandbox · simulator</div>
          </div>
        </div>
        <Link
          href="/new"
          className="btn btn-primary w-full mt-2"
          style={{ height: 32 }}
        >
          <IconPlus size={14} />
          New agent
        </Link>
      </div>
    </aside>
  );
}
