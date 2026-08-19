"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { j } from "@/lib/client";
import { IconBolt, IconSpinner } from "./icons";
import { RunOverlay } from "./run-overlay";

export function RunScanButton({
  slug,
  prompt,
  mode = "simulator",
  children,
}: {
  slug: string;
  prompt?: string;
  mode?: "simulator" | "llm";
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        className="btn btn-primary"
        disabled={busy}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setBusy(true);
          try {
            const res = await j<{ evaluationId: string }>(`/api/agents/${slug}`, {
              method: "POST",
              body: JSON.stringify({ prompt, mode }),
            });
            router.push(`/evaluations/${res.evaluationId}`);
          } catch {
            setBusy(false);
          }
        }}
      >
        {busy ? <IconSpinner size={13} /> : <IconBolt size={13} />}
        {children ?? "Run scan"}
      </button>
      {busy ? <RunOverlay mode={mode} /> : null}
    </>
  );
}
