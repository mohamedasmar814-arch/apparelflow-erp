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
  // 1. Check authentication
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in.",
      success: "",
    };
  }

  // 2. Server-side RBAC check
  if (session.role !== "CUTTING") {
    return {
      error: "You are not authorized to create cutting orders.",
      success: "",
    };
  }

  // 3. Read form values
  const batchNumber = String(formData.get("batchNumber") ?? "")
    .trim()
    .toUpperCase();

  const recipeId = Number(formData.get("recipeId"));
  const quantity = Number(formData.get("quantity"));

  // 4. Validate input
  if (!batchNumber || !Number.isInteger(recipeId) || recipeId <= 0) {
    return {
      error: "Please enter a valid batch number and recipe.",
      success: "",
    };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      error: "Production quantity must be greater than zero.",
      success: "",
    };
  }

  // 5. Check that recipe exists and load its components
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
      error: "The selected recipe has no components.",
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

  // 7. Create the order and verification items together
  await prisma.cuttingOrder.create({
    data: {
      batchNumber,
      quantity,
      status: "PENDING_VERIFICATION",
      recipeId: recipe.id,
      createdById: session.userId,

      verificationItems: {
        create: recipe.components.map((component) => ({
          recipeComponentId: component.id,

          // Required quantity for the whole production batch
          requiredQty: component.requiredQty * quantity,

          status: "PENDING",
        })),
      },
    },
  });

  revalidatePath("/cutting");
  revalidatePath("/verification");

  return {
    error: "",
    success: `Batch ${batchNumber} was created and sent for verification.`,
  };
}