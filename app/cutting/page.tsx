import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { logoutAction } from "../logout/actions";
import CuttingOrderForm from "./CuttingOrderForm";
import ResubmitBatchButton from "./ResubmitBatchButton";

export default async function CuttingPage() {
  const session = await getSession();

  // Authentication
  if (!session) {
    redirect("/login");
  }

  // Server-side RBAC
  if (session.role !== "CUTTING") {
    redirect("/login");
  }

  // Load recipes from PostgreSQL
  const recipes = await prisma.recipe.findMany({
    orderBy: {
      styleCode: "asc",
    },
    select: {
      id: true,
      styleCode: true,
      styleName: true,
    },
  });

  // Load cutting batches from PostgreSQL
  const orders = await prisma.cuttingOrder.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      recipe: true,
      verifiedBy: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              ApparelFlow ERP
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Cutting Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              Welcome, {session.name}
            </p>
          </div>

          {/* Logout */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Batch Form */}
          <CuttingOrderForm recipes={recipes} />

          {/* Cutting Batches */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Cutting Batches
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Production batches and their current workflow status.
            </p>

            <div className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                  No cutting batches have been created yet.
                </div>
              ) : (
                orders.map((order) => {
                  // Calculate standard fabric required for the batch
                  const standardFabricExpected =
                    order.recipe.standardFabricPerUnit *
                    order.quantity;

                  // Calculate fabric wastage percentage
                  const wastagePercentage =
                    standardFabricExpected > 0
                      ? ((order.actualFabricUsed -
                          standardFabricExpected) /
                          standardFabricExpected) *
                        100
                      : 0;

                  // Status colour
                  const statusStyle =
                    order.status === "READY"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : order.status === "REJECTED"
                        ? "bg-red-500/10 text-red-400"
                        : order.status === "PENDING_VERIFICATION"
                          ? "bg-amber-500/10 text-amber-400"
                          : order.status === "SEWING"
                            ? "bg-purple-500/10 text-purple-400"
                            : "bg-blue-500/10 text-blue-400";

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border p-4 ${
                        order.status === "REJECTED"
                          ? "border-red-900/60 bg-red-950/10"
                          : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      {/* Batch Header */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-semibold text-white">
                            {order.batchNumber}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {order.recipe.styleCode} -{" "}
                            {order.recipe.styleName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Target Quantity: {order.quantity}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}
                        >
                          {order.status === "REJECTED"
                            ? "🔴 RE-CUT REQUIRED"
                            : order.status === "READY"
                              ? "🟢 READY FOR SEWING"
                              : order.status ===
                                  "PENDING_VERIFICATION"
                                ? "🟡 PENDING VERIFICATION"
                                : order.status === "SEWING"
                                  ? "🧵 SEWING IN PROGRESS"
                                  : order.status.replaceAll(
                                      "_",
                                      " "
                                    )}
                        </span>
                      </div>

                      {/* Fabric Details */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                          <p className="text-xs text-slate-500">
                            Fabric Roll ID
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {order.fabricRollId}
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                          <p className="text-xs text-slate-500">
                            Actual Fabric Used
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {order.actualFabricUsed.toFixed(2)} yds
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                          <p className="text-xs text-slate-500">
                            Standard Fabric
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {standardFabricExpected.toFixed(2)} yds
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                          <p className="text-xs text-slate-500">
                            Wastage
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {wastagePercentage.toFixed(2)}%
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Recipe cap:{" "}
                            {order.recipe.wastageCap.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Rejection Information */}
                      {order.status === "REJECTED" && (
                        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4">
                          <p className="text-sm font-semibold text-red-300">
                            Batch Rejected
                          </p>

                          <p className="mt-2 text-sm text-red-200">
                            Reason:{" "}
                            {order.rejectionReason ??
                              "No rejection reason recorded."}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            Decision by:{" "}
                            {order.verifiedBy?.name ?? "Unknown"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            This batch requires re-cutting before it
                            can return to Verification.
                          </p>

                          <ResubmitBatchButton
                            orderId={order.id}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}