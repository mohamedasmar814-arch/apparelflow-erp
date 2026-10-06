export type ComponentStatus =
  | "PENDING"
  | "GREEN"
  | "YELLOW"
  | "RED";

export type UserRole =
  | "CUTTING"
  | "VERIFICATION"
  | "SEWING";

export type BatchStatus =
  | "CUTTING"
  | "PENDING_VERIFICATION"
  | "READY"
  | "REJECTED"
  | "SEWING";

export function calculateVerificationStatus(
  actualQty: number,
  expectedQty: number
): "GREEN" | "YELLOW" | "RED" {
  if (actualQty === expectedQty) {
    return "GREEN";
  }

  if (actualQty > expectedQty) {
    return "YELLOW";
  }

  return "RED";
}

export function canApproveBatch(
  statuses: ComponentStatus[]
): boolean {
  if (statuses.length === 0) {
    return false;
  }

  const hasPending = statuses.includes("PENDING");
  const hasRed = statuses.includes("RED");

  return !hasPending && !hasRed;
}

export function hasValidRejectionReason(
  reason: string
): boolean {
  return reason.trim().length > 0;
}

export function canVerifyComponents(
  role: UserRole
): boolean {
  return role === "VERIFICATION";
}

export function isEligibleForSewingQueue(
  status: BatchStatus
): boolean {
  return status === "READY";
}