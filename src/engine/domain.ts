export type Domain = "customer-support" | "banking" | "ecommerce" | "coding" | "legal" | "general";

const DOMAIN_MAP: { domain: Domain; hints: RegExp[]; label: string; description: string }[] = [
  {
    domain: "banking",
    label: "Banking & payments",
    description: "transfers, balances, cards, payments",
    hints: [/bank|banking/i, /transfer/i, /balance/i, /account/i, /payment/i, /card/i, /wire/i, /fund/i, /copilot/i],
  },
  {
    domain: "customer-support",
    label: "Customer support",
    description: "orders, refunds, subscriptions, tickets",
    hints: [/support/i, /customer/i, /refund/i, /order/i, /subscription/i, /ticket/i, /helpdesk/i, /assistant/i],
  },
  {
    domain: "ecommerce",
    label: "E-commerce",
    description: "catalog, checkout, shipping, returns",
    hints: [/e-?commerce/i, /catalog/i, /cart/i, /checkout/i, /shipping/i, /inventory/i, /product/i, /store/i, /marketplace/i],
  },
  {
    domain: "coding",
    label: "Software engineering",
    description: "code, review, CI, deploys",
    hints: [/code|coding/i, /repo|repository/i, /pull request|pr/i, /deploy/i, /commit/i, /developer/i, /engineer/i, /lint/i, /ci\b/i],
  },
  {
    domain: "legal",
    label: "Legal",
    description: "contracts, compliance, filings",
    hints: [/legal/i, /contract/i, /compliance/i, /attorney/i, /law/i, /terms of service/i, /nda/i],
  },
];

export function detectDomain(prompt: string): Domain {
  const p = prompt ?? "";
  let best: Domain = "general";
  let bestScore = 0;
  for (const d of DOMAIN_MAP) {
    const score = d.hints.reduce((acc, re) => acc + (re.test(p) ? 1 : 0), 0);
    if (score > bestScore) {
      best = d.domain;
      bestScore = score;
    }
  }
  return best;
}

export const DOMAIN_INFO: Record<Domain, { label: string; description: string }> = {
  banking: DOMAIN_MAP[0],
  "customer-support": DOMAIN_MAP[1],
  ecommerce: DOMAIN_MAP[2],
  coding: DOMAIN_MAP[3],
  legal: DOMAIN_MAP[4],
  general: { label: "General", description: "task-specific assistant" },
};
