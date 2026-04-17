import { describe, it, expect } from "vitest";
import {
  isRecordLocked,
  isLockedByMe,
  isLockedByAnotherUser,
  canEditRecord,
  getWorkflowModeForRecord,
  getLockBannerText,
} from "./workflowRules";

const unlocked = { id: "r1", isLocked: false };
const lockedByAlice = { id: "r2", isLocked: true, lockedBy: "alice", lockedAt: "2026-01-01T10:00:00Z" };
const lockedByBob = { id: "r3", isLocked: true, lockedBy: "bob" };

describe("isRecordLocked", () => {
  it("returns false for unlocked record", () => {
    expect(isRecordLocked(unlocked)).toBe(false);
  });
  it("returns true for locked record", () => {
    expect(isRecordLocked(lockedByAlice)).toBe(true);
  });
  it("returns false for null", () => {
    expect(isRecordLocked(null)).toBe(false);
  });
});

describe("isLockedByMe", () => {
  it("returns true when actor matches lock owner", () => {
    expect(isLockedByMe(lockedByAlice, "alice")).toBe(true);
  });
  it("returns false when actor differs", () => {
    expect(isLockedByMe(lockedByAlice, "bob")).toBe(false);
  });
  it("returns false when record is unlocked", () => {
    expect(isLockedByMe(unlocked, "alice")).toBe(false);
  });
  it("returns false for null actor", () => {
    expect(isLockedByMe(lockedByAlice, null)).toBe(false);
  });
});

describe("isLockedByAnotherUser", () => {
  it("returns true when lock owner differs from actor", () => {
    expect(isLockedByAnotherUser(lockedByAlice, "bob")).toBe(true);
  });
  it("returns false when actor matches lock owner", () => {
    expect(isLockedByAnotherUser(lockedByAlice, "alice")).toBe(false);
  });
  it("returns false for unlocked record", () => {
    expect(isLockedByAnotherUser(unlocked, "bob")).toBe(false);
  });
  it("returns true when actor is null and record is locked", () => {
    expect(isLockedByAnotherUser(lockedByBob, null)).toBe(true);
  });
});

describe("canEditRecord", () => {
  it("returns true for unlocked record with permission", () => {
    expect(canEditRecord(unlocked, "alice", true)).toBe(true);
  });
  it("returns false without permission", () => {
    expect(canEditRecord(unlocked, "alice", false)).toBe(false);
  });
  it("returns true when locked by the same actor with permission", () => {
    expect(canEditRecord(lockedByAlice, "alice", true)).toBe(true);
  });
  it("returns false when locked by another user", () => {
    expect(canEditRecord(lockedByAlice, "bob", true)).toBe(false);
  });
  it("returns false for null record", () => {
    expect(canEditRecord(null, "alice", true)).toBe(false);
  });
});

describe("getWorkflowModeForRecord", () => {
  it("returns edit for unlocked record with permission", () => {
    expect(getWorkflowModeForRecord(unlocked, "alice", true)).toBe("edit");
  });
  it("returns view without permission", () => {
    expect(getWorkflowModeForRecord(unlocked, "alice", false)).toBe("view");
  });
  it("returns view when locked by another user", () => {
    expect(getWorkflowModeForRecord(lockedByAlice, "bob", true)).toBe("view");
  });
  it("returns edit when locked by same actor", () => {
    expect(getWorkflowModeForRecord(lockedByAlice, "alice", true)).toBe("edit");
  });
});

describe("getLockBannerText", () => {
  it("returns empty string for unlocked record", () => {
    expect(getLockBannerText(unlocked, "alice")).toBe("");
  });
  it("returns 'Locked by you' when actor matches", () => {
    const text = getLockBannerText(lockedByAlice, "alice");
    expect(text).toContain("Locked by you");
    expect(text).toContain("2026-01-01T10:00:00Z");
  });
  it("returns owner name when locked by another", () => {
    const text = getLockBannerText(lockedByAlice, "bob");
    expect(text).toContain("alice");
  });
  it("returns fallback when lockedBy is missing", () => {
    const noOwner = { id: "r4", isLocked: true };
    const text = getLockBannerText(noOwner, "alice");
    expect(text).toContain("another user");
  });
});
