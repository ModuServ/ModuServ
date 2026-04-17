// ============================================================
// ModuServ AI Decision Support Engine
// Rule-based · Deterministic · Offline-first
// Supports multiple concurrent issues and repair complexity
// ============================================================

// ── Public types ────────────────────────────────────────────

export type SuggestedPriority = "Low" | "Medium" | "High";
export type SuggestedCategory = "Power" | "Battery" | "Display" | "Charging" | "General";

export type AIUrgency = "Low" | "Medium" | "High" | "Critical";
export type AIRisk = "Low" | "Medium" | "High";
export type RepairComplexity = "Single" | "Multiple" | "Complex";

export type DetectedIssue = {
  /** Stable identifier matching the IssueDefinition that produced this entry */
  issueId: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Repair category this issue maps to */
  category: SuggestedCategory;
  /** Urgency level contributed by this specific issue */
  urgencyContribution: AIUrgency;
};

export type AIAssessmentInput = {
  checkInCondition?: string;
  waterDamage?: "Yes" | "No";
  backGlassCracked?: "Yes" | "No";
  ber?: boolean;
  status?: string;
  partRequired?: string;
  partAllocated?: string;
  partStatus?: string;
  technicianNotes?: string;
  repairStartTime?: string;
  brand?: string;
  deviceType?: string;
};

export type AIAssessment = {
  /** Highest urgency across all detected issues */
  suggestedUrgency: AIUrgency;
  suggestedRisk: AIRisk;
  recommendedNextStatus: string | null;
  flags: string[];
  confidenceScore: number;
  explanation: string;
  /** All individually identified issues, ordered by urgency descending */
  detectedIssues: DetectedIssue[];
  /** Unique repair categories detected, primary (highest urgency) first */
  suggestedCategories: SuggestedCategory[];
  /** Single / Multiple / Complex — indicates repair scope */
  repairComplexity: RepairComplexity;
  // ── Backward-compatible fields ───────────────────────────
  /** Primary category (first entry of suggestedCategories) */
  suggestedCategory: SuggestedCategory;
  /** Maps urgency to the legacy Low/Medium/High priority field */
  suggestedPriority: SuggestedPriority;
};

// ── Issue definitions ────────────────────────────────────────
// Each definition is checked independently so multiple can match
// simultaneously — producing a DetectedIssue for each hit.

type IssueDefinition = {
  id: string;
  category: SuggestedCategory;
  label: string;
  keywords: string[];
  baseUrgency: AIUrgency;
};

const ISSUE_DEFINITIONS: IssueDefinition[] = [
  {
    id: "power_failure",
    category: "Power",
    label: "Power failure — device not turning on",
    keywords: [
      "no power",
      "won't turn on",
      "wont turn on",
      "not powering on",
      "not turning on",
      "doesn't turn on",
      "doesnt turn on",
      "dead device",
      "phone is dead",
      "completely dead",
      "boot loop",
      "stuck on logo",
    ],
    baseUrgency: "High",
  },
  {
    id: "heat_event",
    category: "Power",
    label: "Overheating or heat event",
    keywords: [
      "overheating",
      "overheats",
      "burning smell",
      "burn smell",
      "smoke",
      "very hot",
      "gets hot",
    ],
    baseUrgency: "High",
  },
  {
    id: "battery_swollen",
    category: "Battery",
    label: "Swollen battery — physical safety risk",
    keywords: [
      "swollen battery",
      "swollen",
      "bulging battery",
      "bloated battery",
    ],
    baseUrgency: "High",
  },
  {
    id: "battery_drain",
    category: "Battery",
    label: "Battery drain or degradation",
    keywords: [
      "battery drains",
      "drains quickly",
      "drains fast",
      "draining fast",
      "draining quickly",
      "draining",
      "battery health",
      "battery life",
      "battery issue",
      "dead battery",
      "poor battery",
      "bad battery",
      "battery",
    ],
    baseUrgency: "Medium",
  },
  {
    id: "charging_fault",
    category: "Charging",
    label: "Charging port or charging fault",
    keywords: [
      "charging issue",
      "not charging",
      "charge slowly",
      "charges slowly",
      "charges very slowly",
      "slow charging",
      "port damaged",
      "damaged port",
      "usb c",
      "usb-c",
      "lightning port",
      "won't charge",
      "wont charge",
      "charger port",
      "charging port",
    ],
    baseUrgency: "Medium",
  },
  {
    id: "display_damage",
    category: "Display",
    label: "Screen or display damage",
    keywords: [
      "screen crack",
      "cracked screen",
      "broken screen",
      "screen damage",
      "smashed screen",
      "display",
      "oled",
      "lcd",
      "touch not working",
      "touchscreen",
      "touch screen",
      "lines on screen",
      "screen lines",
      "lines across",
      "dead pixels",
      "digitizer",
      "display issue",
    ],
    baseUrgency: "Medium",
  },
  {
    id: "cosmetic_damage",
    category: "General",
    label: "Cosmetic or housing damage",
    keywords: [
      "cosmetic",
      "scratch",
      "scratched",
      "housing damage",
      "backglass",
      "back glass",
      "cracked back",
      "back cracked",
      "dent",
      "scuff",
      "worn",
      "frame damage",
      "bent",
    ],
    baseUrgency: "Low",
  },
];

// ── Helpers ──────────────────────────────────────────────────

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

const URGENCY_RANK: Record<AIUrgency, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function maxUrgency(a: AIUrgency, b: AIUrgency): AIUrgency {
  return URGENCY_RANK[a] >= URGENCY_RANK[b] ? a : b;
}

// ── Core issue detection ─────────────────────────────────────

function detectAllIssues(text: string, input: AIAssessmentInput): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  for (const def of ISSUE_DEFINITIONS) {
    if (!containsAny(text, def.keywords)) continue;

    // Escalate to Critical when water damage compounds a High-urgency issue
    let urgency: AIUrgency = def.baseUrgency;
    if (
      input.waterDamage === "Yes" &&
      (def.id === "power_failure" || def.id === "heat_event")
    ) {
      urgency = "Critical";
    }

    issues.push({ issueId: def.id, label: def.label, category: def.category, urgencyContribution: urgency });
  }

  // Water damage as a standalone issue if no functional issue already detected
  if (input.waterDamage === "Yes") {
    const hasFunctionalIssue = issues.some((i) => i.category !== "General");
    issues.push({
      issueId: "water_damage",
      label: hasFunctionalIssue
        ? "Water damage — elevated component risk"
        : "Water damage — full diagnostic required",
      category: "General",
      urgencyContribution: hasFunctionalIssue ? "Critical" : "High",
    });
  }

  // BER as an explicit issue
  if (input.ber) {
    issues.push({
      issueId: "ber",
      label: "Beyond Economic Repair — repair may not be cost-effective",
      category: "General",
      urgencyContribution: "High",
    });
  }

  // Sort: Critical first, then High, Medium, Low
  issues.sort(
    (a, b) => URGENCY_RANK[b.urgencyContribution] - URGENCY_RANK[a.urgencyContribution]
  );

  return issues;
}

// ── Aggregated assessments ───────────────────────────────────

function aggregateUrgency(issues: DetectedIssue[], input: AIAssessmentInput): AIUrgency {
  if (issues.length === 0) return "Medium";

  let top: AIUrgency = issues[0].urgencyContribution;

  // Two or more High/Critical issues together escalate overall urgency
  const highOrCritical = issues.filter(
    (i) => URGENCY_RANK[i.urgencyContribution] >= 3
  ).length;
  if (highOrCritical >= 2 && top === "High") top = "Critical";

  // Water damage escalates an existing High to Critical
  if (input.waterDamage === "Yes" && top === "High") top = "Critical";

  return top;
}

function aggregateRisk(issues: DetectedIssue[], input: AIAssessmentInput): AIRisk {
  const text = (input.checkInCondition ?? "").toLowerCase().trim();

  // Hard High-risk triggers
  if (input.waterDamage === "Yes") return "High";
  if (input.ber) return "High";
  if (containsAny(text, ["burning smell", "burn smell", "smoke"])) return "High";
  if (issues.some((i) => i.issueId === "battery_swollen") || text.includes("swollen")) return "High";

  // Multiple issues raise risk above a single issue
  if (issues.length >= 3) return "High";
  if (issues.length === 2) return "Medium";

  // Single issue risk
  const topUrgency = issues[0]?.urgencyContribution ?? "Low";
  if (topUrgency === "High") return "Medium";
  if (topUrgency === "Medium") return "Low";
  return "Low";
}

function computeRepairComplexity(
  issues: DetectedIssue[],
  input: AIAssessmentInput
): RepairComplexity {
  const uniqueCategories = new Set(
    issues.filter((i) => i.category !== "General").map((i) => i.category)
  );
  const count = uniqueCategories.size;

  if (
    count >= 3 ||
    (input.waterDamage === "Yes" && count >= 1) ||
    issues.some((i) => i.urgencyContribution === "Critical")
  ) {
    return "Complex";
  }

  if (count >= 2) return "Multiple";
  return "Single";
}

// ── Status recommendation ────────────────────────────────────

function recommendNextStatus(
  input: AIAssessmentInput,
  complexity: RepairComplexity
): string | null {
  const { status, partRequired, partAllocated } = input;
  if (!status) return null;

  switch (status) {
    case "New":
      // Complex jobs always need full diagnosis before any repair decision
      return complexity === "Complex" ? "In Diagnosis" : "In Diagnosis";
    case "In Diagnosis":
      if (partRequired === "Yes" && partAllocated !== "Yes") return "Awaiting Parts";
      // Multiple-issue jobs go to Awaiting Repair to scope the full repair
      return "Awaiting Repair";
    case "Awaiting Repair":
      return "In Progress";
    case "In Progress":
      return "Post Repair Device Check";
    case "Post Repair Device Check":
      return "Ready For Collection";
    case "Ready For Collection Unsuccessful":
      return "Awaiting Customer Reply";
    case "Awaiting Customer Reply":
      return "In Progress";
    default:
      return null;
  }
}

// ── Flags ────────────────────────────────────────────────────

function detectFlags(
  input: AIAssessmentInput,
  issues: DetectedIssue[],
  complexity: RepairComplexity
): string[] {
  const flags: string[] = [];
  const text = (input.checkInCondition ?? "").toLowerCase().trim();
  const {
    waterDamage,
    ber,
    status,
    technicianNotes,
    partRequired,
    partStatus,
    repairStartTime,
    backGlassCracked,
  } = input;

  // Safety flags (always first)
  if (waterDamage === "Yes") {
    flags.push("Water damage detected — elevated risk to components");
  }
  if (containsAny(text, ["burning smell", "burn smell", "smoke"])) {
    flags.push("Burning smell or smoke reported — immediate safety check required");
  }
  if (containsAny(text, ["swollen battery", "swollen", "bloated battery"])) {
    flags.push("Swollen battery detected — safety hazard, handle with care");
  }
  if (ber) {
    flags.push("Device marked as Beyond Economic Repair");
  }

  // Multi-issue / complexity flags
  if (complexity === "Complex") {
    flags.push(
      "Complex multi-issue job — full diagnostic required before committing to repair scope"
    );
  } else if (complexity === "Multiple") {
    flags.push(
      "Multiple repairs required — review job pricing and confirm scope with customer"
    );
  }

  // Workflow readiness flags
  const workflowStatuses = [
    "In Diagnosis",
    "Awaiting Repair",
    "In Progress",
    "Post Repair Device Check",
  ];
  if (workflowStatuses.includes(status ?? "") && !technicianNotes?.trim()) {
    flags.push("Missing technician notes for current workflow stage");
  }
  if (partRequired === "Yes" && !partStatus?.trim()) {
    flags.push("Part required but part status is not set");
  }
  if (status === "In Progress" && !repairStartTime?.trim()) {
    flags.push("Repair in progress but timer has not been started");
  }
  if (backGlassCracked === "Yes" && !containsAny(text, ["back", "glass", "cracked"])) {
    flags.push("Back glass damage recorded but not described in condition notes");
  }

  // Cross-issue consistency flags
  const hasPowerIssue = issues.some((i) => i.issueId === "power_failure");
  const hasDisplayIssue = issues.some((i) => i.issueId === "display_damage");
  if (hasPowerIssue && hasDisplayIssue) {
    flags.push(
      "Power failure and display damage both present — confirm screen is secondary to power issue"
    );
  }

  return flags;
}

// ── Confidence ───────────────────────────────────────────────

function computeConfidence(
  input: AIAssessmentInput,
  issues: DetectedIssue[]
): number {
  const text = (input.checkInCondition ?? "").toLowerCase().trim();

  let score = 0.38;

  // Text length
  if (text.length > 10) score += 0.12;
  if (text.length > 40) score += 0.05;

  // Each distinct issue detected adds confidence
  score += Math.min(issues.length * 0.07, 0.28);

  // Explicit field values
  if (input.waterDamage !== undefined) score += 0.08;
  if (input.ber !== undefined) score += 0.05;
  if (input.backGlassCracked !== undefined) score += 0.04;
  if (input.partRequired !== undefined) score += 0.03;
  if (input.status) score += 0.05;

  return Math.min(Math.round(score * 100) / 100, 0.95);
}

// ── Explanation ──────────────────────────────────────────────

function generateExplanation(
  input: AIAssessmentInput,
  issues: DetectedIssue[],
  urgency: AIUrgency,
  risk: AIRisk,
  flags: string[]
): string {
  if (issues.length === 0 && !input.waterDamage && !input.ber) {
    return "Insufficient information provided. Add a check-in condition description to improve the assessment.";
  }

  const parts: string[] = [];

  if (issues.length === 1) {
    // Single issue — use a focused explanation
    const issue = issues[0];
    if (urgency === "Critical") {
      parts.push(`Critical: ${issue.label}.`);
    } else if (urgency === "High") {
      parts.push(`${issue.label} — urgent attention required.`);
    } else if (urgency === "Medium") {
      parts.push(`${issue.label} — device is functional but service-impacting.`);
    } else {
      parts.push(`${issue.label} — low impact, device likely functional.`);
    }
  } else {
    // Multiple issues — list all and highlight the critical concern
    parts.push(
      `${issues.length} issues detected: ${issues.map((i, n) => `(${n + 1}) ${i.label}`).join("; ")}.`
    );

    const primary = issues[0];
    if (urgency === "Critical") {
      parts.push(`Address "${primary.label}" first — critical risk present.`);
    } else {
      parts.push(`Primary concern: "${primary.label}".`);
    }
  }

  if (risk === "High") {
    const reasons: string[] = [];
    if (input.waterDamage === "Yes") reasons.push("water ingress");
    if (input.ber) reasons.push("BER status");
    const text = (input.checkInCondition ?? "").toLowerCase();
    if (containsAny(text, ["swollen", "bulging", "bloated"])) reasons.push("swollen battery");
    if (containsAny(text, ["burning smell", "burn smell", "smoke"])) reasons.push("burning smell");
    if (reasons.length > 0) {
      parts.push(`Risk rated high: ${reasons.join(", ")}.`);
    }
  }

  if (flags.length > 0) {
    parts.push(`${flags.length} flag${flags.length === 1 ? "" : "s"} require attention.`);
  }

  return parts.join(" ");
}

// ── Priority / category derivation ──────────────────────────

function urgencyToSuggestedPriority(urgency: AIUrgency): SuggestedPriority {
  if (urgency === "Critical" || urgency === "High") return "High";
  if (urgency === "Low") return "Low";
  return "Medium";
}

function derivePrimaryCategory(issues: DetectedIssue[]): SuggestedCategory {
  // Primary = category of the highest-urgency non-General issue
  const functional = issues.filter((i) => i.category !== "General");
  return functional.length > 0 ? functional[0].category : "General";
}

function deriveAllCategories(issues: DetectedIssue[]): SuggestedCategory[] {
  const seen = new Set<SuggestedCategory>();
  const ordered: SuggestedCategory[] = [];
  for (const issue of issues) {
    if (!seen.has(issue.category)) {
      seen.add(issue.category);
      ordered.push(issue.category);
    }
  }
  return ordered.length > 0 ? ordered : ["General"];
}

// ── Main export ──────────────────────────────────────────────

export function runAIAssessment(input: AIAssessmentInput): AIAssessment {
  const text = (input.checkInCondition ?? "").toLowerCase().trim();

  const detectedIssues = detectAllIssues(text, input);
  const suggestedUrgency = aggregateUrgency(detectedIssues, input);
  const suggestedRisk = aggregateRisk(detectedIssues, input);
  const repairComplexity = computeRepairComplexity(detectedIssues, input);
  const nextStatus = recommendNextStatus(input, repairComplexity);
  const flags = detectFlags(input, detectedIssues, repairComplexity);
  const confidenceScore = computeConfidence(input, detectedIssues);
  const explanation = generateExplanation(input, detectedIssues, suggestedUrgency, suggestedRisk, flags);
  const suggestedCategories = deriveAllCategories(detectedIssues);
  const suggestedCategory = derivePrimaryCategory(detectedIssues);
  const suggestedPriority = urgencyToSuggestedPriority(suggestedUrgency);

  return {
    suggestedUrgency,
    suggestedRisk,
    recommendedNextStatus: nextStatus,
    flags,
    confidenceScore,
    detectedIssues,
    suggestedCategories,
    repairComplexity,
    explanation,
    suggestedCategory,
    suggestedPriority,
  };
}

// ── Backward-compatible exports (legacy callers) ─────────────

export function suggestPriority(issue: string): SuggestedPriority {
  return runAIAssessment({ checkInCondition: issue }).suggestedPriority;
}

export function suggestCategory(issue: string): SuggestedCategory {
  return runAIAssessment({ checkInCondition: issue }).suggestedCategory;
}

export function explainPrioritySuggestion(issue: string, _priority: SuggestedPriority): string {
  return runAIAssessment({ checkInCondition: issue }).explanation;
}
