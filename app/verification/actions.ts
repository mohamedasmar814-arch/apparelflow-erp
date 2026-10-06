"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { getSession } from "../../lib/auth";
import {
  calculateVerificationStatus,
  canApproveBatch,
  canVerifyComponents,
  hasValidRejectionReason,
} from "../../lib/production-rules";

export type VerificationState = {
  error: string;
  success: string;
};

export async function verifyComponent(
  _previousState: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  // Tested RBAC rule
  if (!canVerifyComponents(session.role)) {
    return {
      error: "You are not authorized to verify components.",
      success: "",
    };
  }

  const verificationItemId = Number(
    formData.get("verificationItemId")
  );

  const actualQty = Number(formData.get("actualQty"));

  if (
    !Number.isInteger(verificationItemId) ||
    verificationItemId <= 0
  ) {
    return {
      error: "Invalid verification item.",
      success: "",
    };
  }

  if (
    !Number.isFinite(actualQty) ||
    !Number.isInteger(actualQty) ||
    actualQty < 0
  ) {
    return {
      error:
        "Actual quantity must be a whole number of zero or greater.",
      success: "",
    };
  }

  const item = await prisma.verificationItem.findUnique({
    where: {
      id: verificationItemId,
    },
    include: {
      recipeComponent: true,
      cuttingOrder: true,
    },
  });

  if (!item) {
    return {
      error: "Verification item was not found.",
      success: "",
    };
  }

  if (
    item.cuttingOrder.status !== "PENDING_VERIFICATION"
  ) {
    return {
      error:
        "This batch is not currently available for verification.",
      success: "",
    };
  }

  // Tested traffic-light business rule
  const newStatus = calculateVerificationStatus(
    actualQty,
    item.requiredQty
  );

  await prisma.$transaction([
    prisma.verificationItem.update({
      where: {
        id: item.id,
      },
      data: {
        actualQty,
        status: newStatus,
      },
    }),

    prisma.verificationLog.create({
      data: {
        verificationItemId: item.id,
        verifierId: session.userId,
        previousStatus: item.status,
        newStatus,
        actualQty,
        note:
          newStatus === "GREEN"
            ? "Actual quantity exactly matches expected quantity."
            : newStatus === "YELLOW"
              ? "Actual quantity exceeds expected quantity."
              : "Actual quantity is below expected quantity.",
      },
    }),
  ]);

  // Verification does NOT automatically approve the batch.
  // Final approval/rejection remains a separate gatekeeper decision.

  revalidatePath("/verification");
  revalidatePath("/cutting");
  revalidatePath("/sewing");

  if (newStatus === "GREEN") {
    return {
      error: "",
      success: `${item.recipeComponent.name}: GREEN — quantity exactly matches the requirement.`,
    };
  }

  if (newStatus === "YELLOW") {
    return {
      error: "",
      success: `${item.recipeComponent.name}: YELLOW — excess quantity recorded.`,
    };
  }

  return {
    error: "",
    success: `${item.recipeComponent.name}: RED — shortage detected. Batch approval must be blocked.`,
  };
}

export async function approveBatch(
  cuttingOrderId: number
): Promise<VerificationState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  if (!canVerifyComponents(session.role)) {
    return {
      error: "You are not authorized to approve batches.",
      success: "",
    };
  }

  if (
    !Number.isInteger(cuttingOrderId) ||
    cuttingOrderId <= 0
  ) {
    return {
      error: "Invalid batch.",
      success: "",
    };
  }

  const order = await prisma.cuttingOrder.findUnique({
    where: {
      id: cuttingOrderId,
    },
    include: {
      recipe: true,
      verificationItems: {
        include: {
          recipeComponent: true,
        },
      },
    },
  });

  if (!order) {
    return {
      error: "Batch was not found.",
      success: "",
    };
  }

  if (order.status !== "PENDING_VERIFICATION") {
    return {
      error: "This batch is not waiting for verification.",
      success: "",
    };
  }

  const statuses = order.verificationItems.map(
    (item) => item.status
  );

  /*
   * Tested approval gate.
   *
   * Approval is allowed only when:
   * - verification components exist
   * - no component is PENDING
   * - no component is RED
   *
   * GREEN and YELLOW are allowed.
   */
  if (!canApproveBatch(statuses)) {
    if (order.verificationItems.length === 0) {
      return {
        error: "This batch has no verification components.",
        success: "",
      };
    }

    if (
      order.verificationItems.some(
        (item) => item.status === "PENDING"
      )
    ) {
      return {
        error:
          "All components must be verified before approving the batch.",
        success: "",
      };
    }

    if (
      order.verificationItems.some(
        (item) => item.status === "RED"
      )
    ) {
      return {
        error:
          "Approval blocked: this batch contains a RED component shortage.",
        success: "",
      };
    }

    return {
      error: "This batch cannot be approved.",
      success: "",
    };
  }

  const standardFabricExpected =
    order.recipe.standardFabricPerUnit * order.quantity;

  if (
    !Number.isFinite(standardFabricExpected) ||
    standardFabricExpected <= 0
  ) {
    return {
      error: "Unable to calculate expected fabric usage.",
      success: "",
    };
  }

  const wastagePercentage =
    ((order.actualFabricUsed - standardFabricExpected) /
      standardFabricExpected) *
    100;

  const verifiedAt = new Date();

  /*
   * Final approval transaction.
   *
   * The status change and immutable audit snapshot are
   * committed together.
   */
  await prisma.$transaction(async (tx) => {
    const updatedOrder =
      await tx.cuttingOrder.updateMany({
        where: {
          id: order.id,
          status: "PENDING_VERIFICATION",
        },
        data: {
          status: "READY",
          verifiedById: session.userId,
          verifiedAt,
          rejectionReason: null,
        },
      });

    if (updatedOrder.count !== 1) {
      throw new Error(
        "The batch is no longer available for approval."
      );
    }

    await tx.batchVerificationAudit.create({
      data: {
        cuttingOrderId: order.id,
        verifierId: session.userId,
        decision: "APPROVED",
        rejectionReason: null,
        actualFabricUsed: order.actualFabricUsed,
        standardFabricExpected,
        wastagePercentage,

        items: {
          create: order.verificationItems.map((item) => ({
            componentName: item.recipeComponent.name,
            expectedQty: item.requiredQty,
            actualQty: item.actualQty,
            status: item.status,
          })),
        },
      },
    });
  });

  revalidatePath("/verification");
  revalidatePath("/cutting");
  revalidatePath("/sewing");

  return {
    error: "",
    success: `Batch ${order.batchNumber} approved for sewing.`,
  };
}

export async function rejectBatch(
  cuttingOrderId: number,
  reason: string
): Promise<VerificationState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  if (!canVerifyComponents(session.role)) {
    return {
      error: "You are not authorized to reject batches.",
      success: "",
    };
  }

  if (
    !Number.isInteger(cuttingOrderId) ||
    cuttingOrderId <= 0
  ) {
    return {
      error: "Invalid batch.",
      success: "",
    };
  }

  // Tested mandatory rejection-reason rule
  if (!hasValidRejectionReason(reason)) {
    return {
      error: "A rejection reason is required.",
      success: "",
    };
  }

  const rejectionReason = reason.trim();

  const order = await prisma.cuttingOrder.findUnique({
    where: {
      id: cuttingOrderId,
    },
    include: {
      recipe: true,
      verificationItems: {
        include: {
          recipeComponent: true,
        },
      },
    },
  });

  if (!order) {
    return {
      error: "Batch was not found.",
      success: "",
    };
  }

  if (order.status !== "PENDING_VERIFICATION") {
    return {
      error: "This batch is not waiting for verification.",
      success: "",
    };
  }

  const standardFabricExpected =
    order.recipe.standardFabricPerUnit * order.quantity;

  if (
    !Number.isFinite(standardFabricExpected) ||
    standardFabricExpected <= 0
  ) {
    return {
      error: "Unable to calculate expected fabric usage.",
      success: "",
    };
  }

  const wastagePercentage =
    ((order.actualFabricUsed - standardFabricExpected) /
      standardFabricExpected) *
    100;

  const verifiedAt = new Date();

  /*
   * Final rejection transaction.
   *
   * Rejection is allowed even when some components are
   * still PENDING. The audit therefore supports nullable
   * actual quantities and PENDING snapshots.
   */
  await prisma.$transaction(async (tx) => {
    const updatedOrder =
      await tx.cuttingOrder.updateMany({
        where: {
          id: order.id,
          status: "PENDING_VERIFICATION",
        },
        data: {
          status: "REJECTED",
          verifiedById: session.userId,
          verifiedAt,
          rejectionReason,
        },
      });

    if (updatedOrder.count !== 1) {
      throw new Error(
        "The batch is no longer available for rejection."
      );
    }

    await tx.batchVerificationAudit.create({
      data: {
        cuttingOrderId: order.id,
        verifierId: session.userId,
        decision: "REJECTED",
        rejectionReason,
        actualFabricUsed: order.actualFabricUsed,
        standardFabricExpected,
        wastagePercentage,

        items: {
          create: order.verificationItems.map((item) => ({
            componentName: item.recipeComponent.name,
            expectedQty: item.requiredQty,
            actualQty: item.actualQty,
            status: item.status,
          })),
        },
      },
    });
  });

  revalidatePath("/verification");
  revalidatePath("/cutting");
  revalidatePath("/sewing");

  return {
    error: "",
    success: `Batch ${order.batchNumber} rejected and returned for re-cutting.`,
  };
}