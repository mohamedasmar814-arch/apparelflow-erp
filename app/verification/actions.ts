"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { getSession } from "../../lib/auth";

export type VerificationState = {
  error: string;
  success: string;
};

export async function verifyComponent(
  _previousState: VerificationState,
  formData: FormData
): Promise<VerificationState> {
  // 1. Authentication
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  // 2. Server-side RBAC
  if (session.role !== "VERIFICATION") {
    return {
      error: "You are not authorized to verify components.",
      success: "",
    };
  }

  // 3. Read form values
  const verificationItemId = Number(
    formData.get("verificationItemId")
  );

  const actualQty = Number(formData.get("actualQty"));

  // 4. Validate input
  if (
    !Number.isInteger(verificationItemId) ||
    verificationItemId <= 0
  ) {
    return {
      error: "Invalid verification item.",
      success: "",
    };
  }

  if (!Number.isInteger(actualQty) || actualQty < 0) {
    return {
      error: "Actual quantity must be zero or greater.",
      success: "",
    };
  }

  // 5. Get the current item from PostgreSQL
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

  // 6. Traffic-light status calculation
  const newStatus =
    actualQty >= item.requiredQty ? "VERIFIED" : "SHORTAGE";

  // 7. Update item + create audit log atomically
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
          newStatus === "VERIFIED"
            ? "Required quantity confirmed."
            : "Component shortage detected.",
      },
    }),
  ]);

  // 8. Check ALL components in this batch again from the database
  const batchItems = await prisma.verificationItem.findMany({
    where: {
      cuttingOrderId: item.cuttingOrderId,
    },
  });

  const allVerified = batchItems.every(
    (component) => component.status === "VERIFIED"
  );

  // 9. Update the batch status
  await prisma.cuttingOrder.update({
    where: {
      id: item.cuttingOrderId,
    },
    data: {
      status: allVerified ? "READY" : "PENDING_VERIFICATION",
    },
  });

  revalidatePath("/verification");
  revalidatePath("/cutting");
  revalidatePath("/sewing");

  return {
    error: "",
    success:
      newStatus === "VERIFIED"
        ? `${item.recipeComponent.name} verified successfully.`
        : `${item.recipeComponent.name} has a shortage.`,
  };
} 