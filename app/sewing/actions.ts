"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export async function startSewingAssembly(cuttingOrderId: number) {
  // 1. Authentication
  const session = await getSession();

  if (!session) {
    return {
      error: "You must be logged in to start sewing assembly.",
    };
  }

  // 2. Server-side RBAC
  if (session.role !== "SEWING") {
    return {
      error: "Unauthorized. Sewing Supervisor access required.",
    };
  }

  // 3. Defensive validation
  if (
    !Number.isInteger(cuttingOrderId) ||
    cuttingOrderId <= 0
  ) {
    return {
      error: "Invalid production batch.",
    };
  }

  // 4. Retrieve the batch from PostgreSQL
  const order = await prisma.cuttingOrder.findUnique({
    where: {
      id: cuttingOrderId,
    },
    select: {
      id: true,
      status: true,
      verifiedById: true,
      verifiedAt: true,
    },
  });

  if (!order) {
    return {
      error: "Production batch was not found.",
    };
  }

  // 5. HARD STOP
  // Only explicitly approved READY batches can enter sewing.
  if (
    order.status !== "READY" ||
    !order.verifiedById ||
    !order.verifiedAt
  ) {
    return {
      error:
        "This batch is not approved for sewing. Only verified READY batches can start sewing assembly.",
    };
  }

  // 6. Update the persistent workflow state.
  //
  // updateMany with status: READY provides an additional guard:
  // the batch is changed only if it is still READY when the
  // database update happens.
  const result = await prisma.cuttingOrder.updateMany({
    where: {
      id: cuttingOrderId,
      status: "READY",
    },
    data: {
      status: "SEWING",
    },
  });

  if (result.count !== 1) {
    return {
      error:
        "The batch is no longer available to start sewing.",
    };
  }

  // 7. Refresh relevant dashboards
  revalidatePath("/sewing");
  revalidatePath("/cutting");
  revalidatePath("/verification");

  return {
    success: "Sewing assembly started successfully.",
  };
}