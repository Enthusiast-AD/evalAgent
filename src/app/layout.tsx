import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "AgentGuard - Reliability engine for AI agents",
  description: "Generate adversarial scenarios, run agents in a sandbox, and track reliability across versions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain font-sans text-[13px] leading-relaxed">
        <div className="fixed inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-x-0 top-0 h-[420px]"
            style={{
              background:
                "radial-gradient(60% 60% at 50% -10%, rgba(110,120,255,0.08) 0%, rgba(110,120,255,0) 70%)",
            }}
          />
        </div>
        <div className="relative flex min-h-screen">
          <Nav />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
