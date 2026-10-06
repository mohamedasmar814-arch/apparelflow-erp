import { describe, expect, it } from "vitest";

import {
  calculateVerificationStatus,
  canApproveBatch,
  hasValidRejectionReason,
  canVerifyComponents,
  isEligibleForSewingQueue,
} from "../lib/production-rules";

describe("ApparelFlow Production Batch Verification", () => {
  it("allows successful approval when all components are GREEN or YELLOW", () => {
    const statuses = [
      "GREEN",
      "YELLOW",
      "GREEN",
      "GREEN",
      "GREEN",
    ] as const;

    expect(canApproveBatch([...statuses])).toBe(true);
  });

  it("blocks batch approval when any component is RED", () => {
    const statuses = [
      "GREEN",
      "RED",
      "GREEN",
      "GREEN",
      "YELLOW",
    ] as const;

    expect(canApproveBatch([...statuses])).toBe(false);
  });

  it("rejects a batch rejection when no reason is provided", () => {
    expect(hasValidRejectionReason("")).toBe(false);
    expect(hasValidRejectionReason("   ")).toBe(false);

    expect(
      hasValidRejectionReason(
        "Front Panel shortage requires re-cutting."
      )
    ).toBe(true);
  });

  it("prevents unauthorized roles from verifying components", () => {
    expect(canVerifyComponents("CUTTING")).toBe(false);
    expect(canVerifyComponents("SEWING")).toBe(false);
    expect(canVerifyComponents("VERIFICATION")).toBe(true);
  });

  it("isolates the Sewing Queue to READY batches only", () => {
    expect(isEligibleForSewingQueue("READY")).toBe(true);

    expect(
      isEligibleForSewingQueue("PENDING_VERIFICATION")
    ).toBe(false);

    expect(isEligibleForSewingQueue("REJECTED")).toBe(false);
    expect(isEligibleForSewingQueue("CUTTING")).toBe(false);
    expect(isEligibleForSewingQueue("SEWING")).toBe(false);
  });
});

describe("Traffic-Light Verification Rules", () => {
  it("returns GREEN when actual quantity equals expected quantity", () => {
    expect(calculateVerificationStatus(10, 10)).toBe("GREEN");
  });

  it("returns YELLOW when actual quantity exceeds expected quantity", () => {
    expect(calculateVerificationStatus(11, 10)).toBe("YELLOW");
  });

  it("returns RED when actual quantity is below expected quantity", () => {
    expect(calculateVerificationStatus(8, 10)).toBe("RED");
  });
});