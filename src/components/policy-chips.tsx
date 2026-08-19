"use client";

import { parsePolicy, policySummary } from "@/engine/policy";

export function PolicyChips({ prompt }: { prompt: string }) {
  const policy = parsePolicy(prompt);
  const rules = policySummary(policy);

  return (
    <div className="flex flex-wrap gap-1.5">
      {rules.map((r) => (
        <span
          key={r.rule}
          className={`tag ${r.active ? "tag-accent" : "tag-faint"} transition-colors duration-150`}
          title={r.active ? "detected in prompt" : "not present in prompt"}
        >
          <span className="dot" style={{ background: r.active ? "var(--accent)" : "var(--text-faint)" }} />
          {r.rule}
        </span>
      ))}
    </div>
  );
}
