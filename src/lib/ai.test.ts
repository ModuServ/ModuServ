import { describe, it, expect } from "vitest";
import { suggestPriority, suggestCategory, runAIAssessment } from "./ai";

// ── suggestPriority ──────────────────────────────────────────────────────────

describe("suggestPriority", () => {
  it("returns High for power failure", () => {
    expect(suggestPriority("device won't turn on")).toBe("High");
  });
  it("returns High for dead device", () => {
    expect(suggestPriority("phone is completely dead")).toBe("High");
  });
  it("returns High for swollen battery", () => {
    expect(suggestPriority("swollen battery detected")).toBe("High");
  });
  it("returns Medium for battery drain", () => {
    expect(suggestPriority("battery drains quickly")).toBe("Medium");
  });
  it("returns Medium for cracked screen", () => {
    expect(suggestPriority("cracked screen")).toBe("Medium");
  });
  it("returns Medium for charging issue", () => {
    expect(suggestPriority("not charging")).toBe("Medium");
  });
  it("returns Low for cosmetic scratch", () => {
    expect(suggestPriority("minor scratch on housing")).toBe("Low");
  });
  it("returns Medium for empty input", () => {
    expect(suggestPriority("")).toBe("Medium");
  });
});

// ── suggestCategory ──────────────────────────────────────────────────────────

describe("suggestCategory", () => {
  it("returns Power for power failure", () => {
    expect(suggestCategory("won't turn on")).toBe("Power");
  });
  it("returns Battery for drain issue", () => {
    expect(suggestCategory("battery drains fast")).toBe("Battery");
  });
  it("returns Display for cracked screen", () => {
    expect(suggestCategory("cracked screen")).toBe("Display");
  });
  it("returns Charging for port fault", () => {
    expect(suggestCategory("charging port damaged")).toBe("Charging");
  });
  it("returns General for unrecognised input", () => {
    expect(suggestCategory("general wear and tear")).toBe("General");
  });
});

// ── runAIAssessment ──────────────────────────────────────────────────────────

describe("runAIAssessment", () => {
  it("escalates to Critical with water damage + power failure", () => {
    const result = runAIAssessment({
      checkInCondition: "won't turn on",
      waterDamage: "Yes",
    });
    expect(result.suggestedUrgency).toBe("Critical");
    expect(result.suggestedRisk).toBe("High");
  });

  it("flags missing technician notes in active workflow state", () => {
    const result = runAIAssessment({
      checkInCondition: "cracked screen",
      status: "In Diagnosis",
    });
    expect(result.flags.some((f) => f.includes("technician notes"))).toBe(true);
  });

  it("recommends In Diagnosis from New status", () => {
    const result = runAIAssessment({
      checkInCondition: "battery issue",
      status: "New",
    });
    expect(result.recommendedNextStatus).toBe("In Diagnosis");
  });

  it("recommends Awaiting Parts when part required but not allocated", () => {
    const result = runAIAssessment({
      checkInCondition: "screen replacement needed",
      status: "In Diagnosis",
      partRequired: "Yes",
      partAllocated: "No",
    });
    expect(result.recommendedNextStatus).toBe("Awaiting Parts");
  });

  it("marks Complex for water damage + multiple issues", () => {
    const result = runAIAssessment({
      checkInCondition: "cracked screen and not charging",
      waterDamage: "Yes",
    });
    expect(result.repairComplexity).toBe("Complex");
  });

  it("computes confidenceScore between 0 and 0.95", () => {
    const result = runAIAssessment({ checkInCondition: "battery drains quickly" });
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(0.95);
  });

  it("returns General category with empty input", () => {
    const result = runAIAssessment({});
    expect(result.suggestedCategory).toBe("General");
    expect(result.suggestedPriority).toBe("Medium");
  });

  it("BER flag appears in result", () => {
    const result = runAIAssessment({ checkInCondition: "beyond repair", ber: true });
    expect(result.flags.some((f) => f.toLowerCase().includes("beyond economic repair"))).toBe(true);
  });
});
