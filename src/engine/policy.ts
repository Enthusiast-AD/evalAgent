import type { Policy } from "./types";

const KEYWORDS = {
  verifyIdentity: [
    /verify\s+(the\s+)?(customer|caller|user|person|identity)/i,
    /confirm\s+(the\s+)?(identity|caller|customer)/i,
    /identity\s+(must|needs|has|is)\s+\w*\s*verified/i,
    /\bauthenticated\b/i,
    /\blogged\s+in\b/i,
    /verify\s+(they|who|the caller is|the customer is)/i,
  ],
  noUnauthorizedAccess: [
    /(never|do not|don'?t|only)\s+(share|disclose|reveal|give|provide|expose).*(other|another|someone else|different).*(user|account|customer|person)/i,
    /only\s+(share|provide|disclose).*their\s+own/i,
    /do\s+not\s+(share|disclose|reveal).*(belongs to|owned by|not yours)/i,
    /refuse\s+requests?\s+for\s+other\s+people'?s?\s+(data|accounts|information)/i,
    /never\s+(look up|access|read|pull).*(another|other|different).*(user|account|customer)/i,
    /data\s+that\s+(is\s+n't|isn'?t|does\s+n't|doesn'?t)\s+belong/i,
    /(other users|another user|someone else'?s? account|a different account)\b/i,
  ],
  refundLimit: [
    /refunds?\s+(?:limit|cap|maximum|max|ceiling|threshold)(?:\s+is|\s*[:=])?\s*\$?\s*(\d{2,6})/i,
    /(?:above|over|exceed|exceeding|more than|greater than|higher than)\s*\$?\s*(\d{2,6})\s+(?:requires?|need|must have)\s*(?:a\s+)?(?:manager|approval|approver|supervisor)/i,
    /(?:refunds?|transactions?|credits?)\s+(?:over|above)\s*\$?\s*(\d{2,6})/i,
    /(?:limit|cap)\s+refunds?\s*(?:at|to)\s*\$?\s*(\d{2,6})/i,
  ],
  approvalRequired: [
    /(?:requires?|needs?|must\s+have|needs?\s+to\s+get|should\s+get)\s+(?:manager|supervisor|senior|human|approver)\s*(\s+approval|\s+sign-?off)?/i,
    /(?:manager|senior|human|approver)\s+(?:approval|sign-?off|authorization)\s+(?:is|required|needed)/i,
    /approval\s+(?:is|must\s+be)\s+(?:required|needed)/i,
  ],
  oneRefundPerOrder: [
    /one\s+refund\s+per\s+order/i,
    /only\s+one\s+refund/i,
    /no\s+(?:duplicate|double|second|multiple)\s+refunds?/i,
    /never\s+refund\s+(?:an\s+order|the\s+same\s+order)\s+twice/i,
  ],
  injectionGuard: [
    /(ignore|disregard|override|disobey|do not follow)\s+(.*)?(instructions?|prompt|rules|commands|system)/i,
    /(never|do not|don'?t)\s+follow\s+(user|embedded|new|any)\s+instructions?/i,
    /instructions?\s+(in|inside|within|embedded\s+in)\s+(messages|the\s+prompt|user\s+input|your\s+system\s+prompt)/i,
    /system\s+prompt\s+(cannot|can'?t|must\s+not)\s+be\s+(changed|overridden|modified|ignored)/i,
    /(refuse|reject|decline).*(prompt\s+injection|manipulation|jailbreak|malicious)/i,
    /(never|do not)\s+act\s+on\s+instructions?\s+(from|found\s+in|inside|within)\s+(users?|messages?|the\s+conversation)/i,
    /instructions?\s+from\s+users?\s+(cannot|do\s+not)\s+override/i,
    /your\s+(rules|instructions|policy)\s+(cannot|can'?t)\s+be\s+changed\s+by/i,
    /be\s+on\s+guard\s+against\s+prompt\s+injection/i,
  ],
  dataInjectionGuard: [
    /(treat|regard|consider|handle).*(tool\s+results|tool\s+output|search\s+results|documents|articles|returned\s+content|tool\s+data).*(as|not\s+as)\s+(untrusted|data|content|information|instructions)/i,
    /(never|do\s+not|don'?t)\s+(follow|obey|act\s+on)\s*(.*)?(instructions?|commands)\s*(.*)?(found\s+in|inside|within)\s+(tool\s+results|search\s+results|documents|articles|returned\s+content)/i,
    /content\s+returned\s+by\s+tools?\s+is\s+(untrusted|data|content)/i,
    /(instructions?|commands?)\s+embedded\s+in\s+(tool\s+results|search\s+results|documents|data)\s+must\s+be\s+ignored/i,
    /(tool\s+output|returned\s+data|search\s+results)\s+(is|are)\s+untrusted/i,
    /never\s+act\s+on\s+instructions\s+(found\s+in|inside|within)\s+(data|documents|tool\s+output|content)/i,
  ],
  grounded: [
    /(base|ground)\s+(your\s+)?(answers?|responses?|replies?)\s+(only\s+)?on\s+(tool\s+results|provided\s+information|the\s+context|the\s+data|available\s+data)/i,
    /only\s+(use|rely\s+on|answer\s+from|speak\s+from)\s+(provided|given|available|verified|confirmed)\s+(information|context|data|facts)/i,
    /(do\s+not|never|don'?t)\s+(invent|make\s+up|fabricate|guess|hallucinate|assume)\s*(facts|details|orders|amounts|policies)?/i,
    /never\s+(state|claim|say)\s+(things|facts|details)\s+you\s+(do\s+n'?t|don'?t)\s+know/i,
    /if\s+you\s+(don'?t|do\s+n'?t)\s+know,?\s+(say\s+so|admit\s+it|say\s+you\s+don'?t\s+know)/i,
    /only\s+state\s+facts\s+you\s+can\s+verify/i,
    /never\s+guess\s+when\s+you\s+(can|could)\s+(check|verify|look\s+it\s+up)/i,
  ],
  noFalseClaim: [
    /(never|do\s+not|don'?t)\s+(claim|pretend|say)\s+(you|an\s+action|a\s+tool)\s+(did|completed|finished|succeeded|was\s+done|has\s+been\s+done)\s+(until|unless|before)\s+(the\s+tool|the\s+call|it\s+actually|the\s+action)/i,
    /only\s+(confirm|say|report|claim)\s+(success|completion|that\s+it's?\s+done)\s+(after|once|when)\s+(the\s+tool|the\s+call|an\s+action|a\s+tool\s+call)\s+(returns|succeeds|is\s+successful|confirms)/i,
    /report\s+(results|outcomes)\s+(accurately|truthfully)/i,
    /never\s+(claim|say)\s+(an\s+action\s+was\s+taken|you\s+did\s+something)\s+without\s+(calling\s+the\s+tool|calling\s+a\s+tool)/i,
    /only\s+confirm\s+(a\s+)?(refund|action|change)\s+after\s+the\s+(tool|call)\s+returns\s+success/i,
  ],
  escalateOnStuck: [
    /(escalate|hand\s+off|hand\s+over|transfer)\s+(to|it\s+to|this\s+to|the\s+call\s+to)\s*(a\s+|the\s+)?(human|agent|team|support|representative|specialist)/i,
    /(if\s+(you\s+|it\s+)?(cannot|can'?t|are\s+unable|can'?t\s+complete|cannot\s+complete|can'?t\s+resolve))\s*(.*)?(escalate|transfer|hand\s+off)/i,
    /when\s+in\s+doubt,?\s*(escalate|transfer|hand\s+off)/i,
    /(escalate|transfer|hand\s+off).*(when|if).*(unable|cannot|can'?t|unsure|out\s+of\s+scope)/i,
    /for\s+anything\s+you\s+cannot\s+(do|handle|complete)\s+yourself,\s*escalate/i,
  ],
  validateAmounts: [
    /(validate|verify|check|confirm)\s+(the\s+)?(amount|order|balance)\s+(before|prior\s+to|when|and)/i,
    /refunds?\s+(must\s+(never|not)|cannot|can'?t|should\s+never|should\s+not)\s+exceed/i,
    /(amount|refund|transfer)\s+(cannot|can'?t|must\s+not|should\s+never|should\s+not|never)\s+exceed/i,
    /never\s+refund\s+more\s+than\s+the\s+(order\s+)?total/i,
    /never\s+(move|transfer)\s+more\s+than\s+the\s+(available\s+)?balance/i,
    /(amount|refund)\s+must\s+not\s+exceed/i,
    /check\s+(the\s+)?(order|invoice|account)\s+(total|amount|balance)\s+before\s+(refunding|processing|issuing|transferring)/i,
    /(reject|decline|refuse)\s+(negative|zero|invalid|missing)\s+(amounts?|refunds?|transfers?)/i,
    /never\s+(process|accept)\s+(negative|invalid|zero)\s+(amounts?|refunds?|transfers?)/i,
    /always\s+(validate|verify)\s+(amounts?|the\s+amount)/i,
  ],
} as const;

export function parsePolicy(prompt: string): Policy {
  const p = prompt ?? "";
  const test = (list: readonly RegExp[]) => list.some((re) => re.test(p));

  let refundLimit: number | undefined;
  for (const re of KEYWORDS.refundLimit) {
    const m = p.match(re);
    if (m && m[1]) {
      const v = parseInt(m[1], 10);
      if (!Number.isNaN(v)) {
        refundLimit = v;
        break;
      }
    }
  }

  return {
    verifyIdentity: test(KEYWORDS.verifyIdentity),
    refundLimit,
    approvalRequired: test(KEYWORDS.approvalRequired),
    oneRefundPerOrder: test(KEYWORDS.oneRefundPerOrder),
    noUnauthorizedAccess: test(KEYWORDS.noUnauthorizedAccess),
    injectionGuard: test(KEYWORDS.injectionGuard),
    dataInjectionGuard: test(KEYWORDS.dataInjectionGuard),
    grounded: test(KEYWORDS.grounded),
    noFalseClaim: test(KEYWORDS.noFalseClaim),
    escalateOnStuck: test(KEYWORDS.escalateOnStuck),
    validateAmounts: test(KEYWORDS.validateAmounts),
  };
}

export function policySummary(policy: Policy): { rule: string; active: boolean }[] {
  return [
    { rule: "Identity verification before destructive actions", active: policy.verifyIdentity },
    { rule: `Refund limit${policy.refundLimit ? ` ($${policy.refundLimit})` : ""}`, active: policy.refundLimit !== undefined },
    { rule: "Manager approval for high-value actions", active: policy.approvalRequired },
    { rule: "One refund per order", active: policy.oneRefundPerOrder },
    { rule: "No cross-account data disclosure", active: policy.noUnauthorizedAccess },
    { rule: "User instruction injection guard", active: policy.injectionGuard },
    { rule: "Tool-data injection guard", active: policy.dataInjectionGuard },
    { rule: "Grounding (no fabrication)", active: policy.grounded },
    { rule: "Accurate outcome reporting", active: policy.noFalseClaim },
    { rule: "Escalate when stuck", active: policy.escalateOnStuck },
    { rule: "Parameter validation", active: policy.validateAmounts },
  ];
}

const INJECTION_MARKERS = [
  /ignore\s+(all\s+(your\s+|of\s+your\s+)?|any\s+|previous\s+|prior\s+)?(previous|prior|above|earlier)\s+(instructions?|prompt|rules|commands)/i,
  /ignore\s+your\s+(instructions?|system\s+prompt|rules|guidelines)/i,
  /forget\s+(everything|all\s+rules|your\s+instructions|your\s+system\s+prompt)/i,
  /you\s+are\s+now\s+(an?\s+|a\s+)?(unrestricted|uncensored|new|different)\b/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|rules|guidelines|system\s+prompt)/i,
  /override\s+(all\s+)?(instructions?|rules|your\s+guidelines)/i,
  /from\s+now\s+on,?\s+(you\s+)?(ignore|disregard|don'?t\s+follow)/i,
  /jailbreak/i,
  /(system|developer)\s+(instruction|prompt|message)\s*[:=-]/i,
  /pretend\s+you\s+(don'?t|do\s+n'?t)\s+have\s+(any\s+)?(rules|instructions)/i,
  /new\s+instructions\s*[:=-]/i,
];

export function hasInjectionMarker(text: string): boolean {
  return INJECTION_MARKERS.some((re) => re.test(text ?? ""));
}
