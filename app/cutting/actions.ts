"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { getSession } from "../../lib/auth";

export type CuttingOrderState = {
  error: string;
  success: string;
};

export async function createCuttingOrder(
  _previousState: CuttingOrderState,
  formData: FormData
): Promise<CuttingOrderState> {
  // 1. Authentication
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  // 2. Server-side RBAC
  if (session.role !== "CUTTING") {
    return {
      error: "You are not authorized to create cutting orders.",
      success: "",
    };
  }

  // 3. Read and normalize form values
  const batchNumber = String(formData.get("batchNumber") ?? "")
    .trim()
    .toUpperCase();

  const recipeId = Number(formData.get("recipeId"));

  const quantity = Number(formData.get("quantity"));

  const fabricRollId = String(formData.get("fabricRollId") ?? "")
    .trim()
    .toUpperCase();

  const actualFabricUsed = Number(
    formData.get("actualFabricUsed")
  );

  // 4. Defensive validation
  if (!batchNumber) {
    return {
      error: "Batch number is required.",
      success: "",
    };
  }

  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    return {
      error: "Please select a valid recipe.",
      success: "",
    };
  }

  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return {
      error: "Batch quantity must be a whole number greater than zero.",
      success: "",
    };
  }

  if (!fabricRollId) {
    return {
      error: "Fabric Roll ID is required.",
      success: "",
    };
  }

  if (
    !Number.isFinite(actualFabricUsed) ||
    actualFabricUsed <= 0
  ) {
    return {
      error: "Actual fabric used must be greater than zero.",
      success: "",
    };
  }

  // 5. Load the selected recipe and its BOM components
  const recipe = await prisma.recipe.findUnique({
    where: {
      id: recipeId,
    },
    include: {
      components: true,
    },
  });

  if (!recipe) {
    return {
      error: "Selected recipe does not exist.",
      success: "",
    };
  }

  if (recipe.components.length === 0) {
    return {
      error: "The selected recipe has no BOM components.",
      success: "",
    };
  }

  // 6. Prevent duplicate batch numbers
  const existingOrder = await prisma.cuttingOrder.findUnique({
    where: {
      batchNumber,
    },
  });

  if (existingOrder) {
    return {
      error: "This batch number already exists.",
      success: "",
    };
  }

  // 7. Create the cutting batch and expected verification items
  await prisma.cuttingOrder.create({
    data: {
      batchNumber,
      quantity,
      fabricRollId,
      actualFabricUsed,

      // New batches must pass through Verification first.
      status: "PENDING_VERIFICATION",

      recipeId: recipe.id,
      createdById: session.userId,

      verificationItems: {
        create: recipe.components.map((component) => ({
          recipeComponentId: component.id,

          // Expected quantity =
          // target batch quantity × BOM component multiplier
          requiredQty: quantity * component.requiredQty,

          status: "PENDING",
        })),
      },
    },
  });

  revalidatePath("/cutting");
  revalidatePath("/verification");
  revalidatePath("/sewing");

  return {
    error: "",
    success: `Batch ${batchNumber} was created and sent for verification.`,
  };
}

export async function resubmitRejectedBatch(
  cuttingOrderId: number
): Promise<CuttingOrderState> {
  // 1. Authentication
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  // 2. Server-side RBAC
  if (session.role !== "CUTTING") {
    return {
      error: "You are not authorized to resubmit cutting batches.",
      success: "",
    };
  }

  // 3. Validate batch ID
  if (
    !Number.isInteger(cuttingOrderId) ||
    cuttingOrderId <= 0
  ) {
    return {
      error: "Invalid cutting batch.",
      success: "",
    };
  }

  // 4. Load rejected batch and its verification items
  const order = await prisma.cuttingOrder.findUnique({
    where: {
      id: cuttingOrderId,
    },
    include: {
      verificationItems: true,
    },
  });

  if (!order) {
    return {
      error: "Cutting batch was not found.",
      success: "",
    };
  }

  // Only rejected batches may be resubmitted
  if (order.status !== "REJECTED") {
    return {
      error: "Only rejected batches can be resubmitted for verification.",
      success: "",
    };
  }

  if (order.verificationItems.length === 0) {
    return {
      error: "This batch has no verification components.",
      success: "",
    };
  }

  // 5. Reset the batch and component checks atomically
  await prisma.$transaction([
    prisma.verificationItem.updateMany({
      where: {
        cuttingOrderId: order.id,
      },
      data: {
        actualQty: null,
        status: "PENDING",
      },
    }),

    prisma.cuttingOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PENDING_VERIFICATION",

        // The previous rejection is preserved permanently
        // inside BatchVerificationAudit.
        rejectionReason: null,

        // Clear the current final-decision fields because
        // this batch is entering a new verification cycle.
        verifiedById: null,
        verifiedAt: null,
      },
    }),
  ]);

  revalidatePath("/cutting");
  revalidatePath("/verification");
  revalidatePath("/sewing");

  return {
    error: "",
    success: `Batch ${order.batchNumber} was resubmitted for verification.`,
  };
}