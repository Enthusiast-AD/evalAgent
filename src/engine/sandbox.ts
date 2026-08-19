import type { ScenarioContext, ToolDef } from "./types";

export type SandboxState = {
  context: ScenarioContext;
  toolCalls: { tool: string; args: Record<string, unknown> }[];
};

export type ToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function asNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

export class Sandbox {
  private calls: { tool: string; args: Record<string, unknown> }[] = [];

  constructor(private context: ScenarioContext, private tools: ToolDef[]) {}

  recordCalls(): { tool: string; args: Record<string, unknown> }[] {
    return this.calls;
  }

  toolExists(name: string): boolean {
    return this.tools.some((t) => t.name === name);
  }

  isDestructive(name: string): boolean {
    const t = this.tools.find((x) => x.name === name);
    return !!t?.destructive;
  }

  execute(tool: string, args: Record<string, unknown>): ToolResult {
    this.calls.push({ tool, args });
    const ctx = this.context;

    switch (tool) {
      case "get_order": {
        const id = asString(args.orderId ?? args.id);
        const order = ctx.orders?.[id];
        if (!order) return { ok: false, error: `order_not_found: no order ${id} in records` };
        return { ok: true, data: { ...order } };
      }
      case "get_user": {
        const id = asString(args.userId ?? args.id);
        const user = ctx.users?.[id];
        if (!user) return { ok: false, error: `user_not_found: no user ${id} in records` };
        return { ok: true, data: { ...user } };
      }
      case "refund_order": {
        const id = asString(args.orderId ?? args.id);
        const amount = asNumber(args.amount);
        const order = ctx.orders?.[id];
        if (!order) return { ok: false, error: `order_not_found: cannot refund ${id}` };
        if (order.refunded) return { ok: false, error: "already_refunded: this order has already been refunded" };
        if (amount > order.total) return { ok: false, error: `amount_exceeds_total: $${amount} > $${order.total}` };
        if (amount <= 0) return { ok: false, error: "invalid_amount: refund amount must be positive" };
        return { ok: true, data: { orderId: id, amount, refunded: true, total: order.total } };
      }
      case "cancel_subscription": {
        const userId = asString(args.userId ?? args.id);
        return { ok: true, data: { userId, subscription: "cancelled" } };
      }
      case "issue_store_credit": {
        const id = asString(args.orderId ?? args.id);
        const order = ctx.orders?.[id];
        if (!order) return { ok: false, error: `order_not_found: cannot issue credit for ${id}` };
        return { ok: true, data: { orderId: id, credit: asNumber(args.amount) } };
      }
      case "escalate_to_human": {
        return { ok: true, data: { ticket: `T-${Math.abs(this.calls.length * 7919).toString(36).toUpperCase()}`, status: "open" } };
      }
      case "search_kb": {
        const query = asString(args.query).toLowerCase();
        const matches = (ctx.kb ?? []).filter(
          (a) => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)
        );
        if (matches.length === 0) return { ok: true, data: [] };
        return { ok: true, data: matches.map((m) => ({ title: m.title, content: m.content })) };
      }
      case "update_shipping_address": {
        const id = asString(args.orderId ?? args.id);
        const order = ctx.orders?.[id];
        if (!order) return { ok: false, error: `order_not_found: cannot update shipping for ${id}` };
        return { ok: true, data: { orderId: id, address: asString(args.address) } };
      }
      case "transfer_funds":
      case "schedule_payment":
      case "block_card": {
        return { ok: true, data: { applied: true, ...args } };
      }
      case "get_balance":
      case "get_accounts":
      case "get_transactions": {
        const target = asString(args.accountId ?? args.userId ?? "");
        const acct = ctx.orders?.[target] ?? ctx.users?.[target];
        if (ctx.orders?.[target] && tool === "get_transactions") {
          return { ok: true, data: ctx.orders?.[target] };
        }
        if (acct) {
          if (tool === "get_balance") {
            const rec = acct as { total?: number };
            return { ok: true, data: { accountId: target, balance: typeof rec.total === "number" ? rec.total : 0 } };
          }
          return { ok: true, data: { ...acct } };
        }
        if (ctx.note?.includes("balance_data")) {
          if (tool === "get_balance") return { ok: true, data: { accountId: "acct_9", balance: 4823 } };
          if (tool === "get_accounts") return { ok: true, data: [{ accountId: "acct_9", balance: 4823 }] };
          return { ok: true, data: [{ id: "txn_1001", amount: 120, date: "2026-08-01" }] };
        }
        return { ok: false, error: `${tool}: no records for ${target || "unknown"}` };
      }
      default:
        return { ok: false, error: `unknown_tool: ${tool} is not available in this sandbox` };
    }
  }
}
