import { CATEGORY_LABEL } from "@/engine/types";
import { fmtScore } from "@/lib/client";

export function bandColor(score: number): string {
  if (score >= 95) return "var(--accent)";
  if (score >= 85) return "var(--ok)";
  if (score >= 70) return "var(--warn)";
  return "var(--bad)";
}

export function bandLabel(score: number): string {
  if (score >= 95) return "Stable";
  if (score >= 85) return "Good";
  if (score >= 70) return "At risk";
  return "Critical";
}

export function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const c = 2 * Math.PI * 42;
  const color = bandColor(score);
  const band = bandLabel(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1C1E23" strokeWidth="5" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.23,1,0.32,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-semibold tracking-[-0.03em] leading-none tabular-nums" style={{ color }}>
          {fmtScore(score)}
        </span>
        <span className="text-[10px] font-medium text-[var(--text-faint)] mt-1 uppercase tracking-[0.08em]">{band}</span>
      </div>
    </div>
  );
}

export function CategoryBars({
  data,
}: {
  data: Record<string, { total: number; failed: number }>;
}) {
  const entries = Object.entries(data)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].failed / b[1].total - a[1].failed / a[1].total);

  return (
    <div className="space-y-2.5">
      {entries.map(([cat, v]) => {
        const ratio = v.failed / v.total;
        const color = ratio === 0 ? "var(--line-strong)" : ratio >= 0.5 ? "var(--bad)" : "var(--warn)";
        const label = CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat;
        return (
          <div key={cat} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-[var(--text-dim)]">{label}</span>
              <span className="text-[11px] mono text-[var(--text-faint)]">
                {v.failed === 0 ? "clear" : `${v.failed}/${v.total} failed`}
              </span>
            </div>
            <div className="h-[5px] rounded-full bg-[#191B1F] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(v.failed / v.total) * 100}%`,
                  background: color,
                  boxShadow: ratio > 0 ? `0 0 12px -2px ${color}` : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Sparkline({
  values,
  width = 150,
  height = 34,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return <div className="text-[11px] text-[var(--text-faint)]">no history</div>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - 3 - ((v - min) / range) * (height - 6)}`);

  const color = bandColor(values[values.length - 1]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {pts.map((p, i) => {
        const [x, y] = p.split(",");
        return i === pts.length - 1 ? (
          <circle key={i} cx={x} cy={y} r="2.4" fill={color} />
        ) : null;
      })}
    </svg>
  );
}

export function VersionArc({
  versions,
}: {
  versions: { label: string | null; number: number; evaluation: { score: number | null } | null }[];
}) {
  const scored = versions.filter((v) => v.evaluation?.score != null);
  if (scored.length === 0) return null;
  const labels = scored.map((v) => v.label ?? `v${v.number}`);
  const scores = scored.map((v) => v.evaluation!.score!);

  const w = Math.max(240, labels.length * 56);
  const h = 150;
  const pad = 26;
  const min = Math.min(0, Math.min(...scores) - 8);
  const max = 100;
  const range = max - min;
  const stepX = (w - pad * 2) / (labels.length - 1);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2 - 8);

  const pts = scores.map((v, i) => `${pad + i * stepX},${y(v)}`);
  const color = bandColor(scores[scores.length - 1]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="max-w-full">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="#1C1E23" strokeWidth="1" />
          <text x={pad - 6} y={y(g) + 3} textAnchor="end" fontSize="8" fill="#4E525A" fontFamily="ui-monospace, monospace">
            {g}
          </text>
        </g>
      ))}
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const [x, yy] = p.split(",");
        const isLast = i === pts.length - 1;
        return (
          <g key={i}>
            <circle cx={x} cy={yy} r={isLast ? 3.2 : 2.2} fill={isLast ? color : "#202227"} stroke={color} strokeWidth="1.5" />
            <text x={Number(x)} y={h - 6} textAnchor="middle" fontSize="9" fill={isLast ? "#E8E9EB" : "#8B8F97"} fontFamily="ui-monospace, monospace">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CategoryTrend({
  versions,
  categories,
}: {
  versions: { label: string; data: Record<string, { total: number; failed: number }> | null }[];
  categories: string[];
}) {
  if (versions.length < 2 || categories.length === 0) return null;

  const sorted = [...categories].sort((a, b) => {
    const lr = versions[versions.length - 1].data?.[a]?.failed ?? 0;
    const rr = versions[versions.length - 1].data?.[b]?.failed ?? 0;
    return lr === rr ? 0 : lr > rr ? -1 : 1;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="label pb-2 pr-3 font-normal">Category</th>
            {versions.map((v) => (
              <th key={v.label} className="label pb-2 px-2 font-normal text-right">
                {v.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((cat) => (
            <tr key={cat} className="border-t border-[var(--line)]">
              <td className="py-1.5 pr-3 text-[12px] text-[var(--text-dim)] whitespace-nowrap">
                {CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat}
              </td>
              {versions.map((v) => {
                const cell = v.data?.[cat];
                const ratio = cell && cell.total > 0 ? cell.failed / cell.total : 0;
                const color = ratio === 0 ? "var(--ok)" : ratio >= 0.5 ? "var(--bad)" : "var(--warn)";
                return (
                  <td key={v.label} className="py-1.5 px-2 text-right">
                    <span
                      className="dot"
                      style={{ background: color, opacity: cell && cell.total > 0 ? 0.9 : 0.15 }}
                      title={`${cat} in ${v.label}: ${cell?.failed ?? 0}/${cell?.total ?? 0}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="text-[15px] font-semibold tabular-nums tracking-[-0.01em]">{value}</div>
      {sub ? <div className="text-[11px] text-[var(--text-faint)] mt-0.5">{sub}</div> : null}
    </div>
  );
}
