import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { logoutAction } from "../logout/actions";
import VerificationItemForm from "./VerificationItemForm";
import BatchDecisionForm from "./BatchDecisionForm";

export default async function VerificationPage() {
  const session = await getSession();

  // Authentication
  if (!session) {
    redirect("/login");
  }

  // Server-side RBAC
  if (session.role !== "VERIFICATION") {
    redirect("/login");
  }

  // Batches still waiting for a final verification decision
  const pendingOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "PENDING_VERIFICATION",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      recipe: true,
      verificationItems: {
        orderBy: {
          id: "asc",
        },
        include: {
          recipeComponent: true,
        },
      },
    },
  });

  // Recently approved batches
  const readyOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "READY",
    },
    orderBy: {
      verifiedAt: "desc",
    },
    take: 5,
    include: {
      recipe: true,
      verifiedBy: true,
      verificationItems: {
        orderBy: {
          id: "asc",
        },
        include: {
          recipeComponent: true,
        },
      },
    },
  });

  // Recently rejected batches
  const rejectedOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "REJECTED",
    },
    orderBy: {
      verifiedAt: "desc",
    },
    take: 5,
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
            <p className="text-sm font-medium text-emerald-400">
              ApparelFlow ERP
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Verification Dashboard
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

        {/* Waiting for Verification */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Waiting for Verification
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Check every component quantity and make the final
              gatekeeper decision.
            </p>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <h3 className="text-lg font-semibold">
                No batches waiting for verification
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                New cutting batches will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingOrders.map((order) => {
                const hasRed = order.verificationItems.some(
                  (item) => item.status === "RED"
                );

                const hasPending = order.verificationItems.some(
                  (item) => item.status === "PENDING"
                );

                const standardFabricExpected =
                  order.recipe.standardFabricPerUnit *
                  order.quantity;

                const wastagePercentage =
                  standardFabricExpected > 0
                    ? ((order.actualFabricUsed -
                        standardFabricExpected) /
                        standardFabricExpected) *
                      100
                    : 0;

                return (
                  <section
                    key={order.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    {/* Batch Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {order.batchNumber}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {order.recipe.styleCode} -{" "}
                          {order.recipe.styleName}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Production Quantity: {order.quantity}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                        🟡 PENDING VERIFICATION
                      </span>
                    </div>

                    {/* Fabric Information */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Fabric Roll
                        </p>

                        <p className="mt-1 font-medium">
                          {order.fabricRollId}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Expected Fabric
                        </p>

                        <p className="mt-1 font-medium">
                          {standardFabricExpected.toFixed(2)} yds
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Actual Fabric Used
                        </p>

                        <p className="mt-1 font-medium">
                          {order.actualFabricUsed.toFixed(2)} yds
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-4">
                        <p className="text-xs text-slate-500">
                          Fabric Wastage
                        </p>

                        <p className="mt-1 font-medium">
                          {wastagePercentage.toFixed(2)}%
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Cap:{" "}
                          {order.recipe.wastageCap.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Component Verification */}
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {order.verificationItems.map((item) => {
                        const statusStyle =
                          item.status === "GREEN"
                            ? "border-emerald-900/50 bg-emerald-950/20"
                            : item.status === "YELLOW"
                              ? "border-yellow-900/50 bg-yellow-950/20"
                              : item.status === "RED"
                                ? "border-red-900/50 bg-red-950/20"
                                : "border-slate-700 bg-slate-950";

                        const statusLabel =
                          item.status === "GREEN"
                            ? "🟢 GREEN"
                            : item.status === "YELLOW"
                              ? "🟡 YELLOW"
                              : item.status === "RED"
                                ? "🔴 RED"
                                : "⚪ PENDING";

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-4 ${statusStyle}`}
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold text-white">
                                  {item.recipeComponent.name}
                                </h4>

                                <p className="mt-1 text-sm text-slate-400">
                                  Expected: {item.requiredQty}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  Actual:{" "}
                                  {item.actualQty ??
                                    "Not checked"}
                                </p>
                              </div>

                              <span className="text-xs font-medium">
                                {statusLabel}
                              </span>
                            </div>

                            <VerificationItemForm
                              itemId={item.id}
                              currentActualQty={item.actualQty}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Explicit Final Gatekeeper */}
                    <BatchDecisionForm
                      orderId={order.id}
                      hasRed={hasRed}
                      hasPending={hasPending}
                    />
                  </section>
                );
              })}
            </div>
          )}
        </section>

        {/* Recently Approved */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Recently Approved
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Batches explicitly approved and released to the Sewing
              Queue.
            </p>
          </div>

          {readyOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
              No batches have been approved yet.
            </div>
          ) : (
            <div className="space-y-4">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-emerald-900/50 bg-emerald-950/10 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {order.batchNumber}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {order.recipe.styleCode} -{" "}
                        {order.recipe.styleName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Production Quantity: {order.quantity}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Verified by:{" "}
                        {order.verifiedBy?.name ?? "Unknown"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Verified at:{" "}
                        {order.verifiedAt
                          ? order.verifiedAt.toLocaleString()
                          : "Not recorded"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                      🟢 READY FOR SEWING
                    </span>
                  </div>

                  {/* Approved Component Results */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {order.verificationItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <p className="font-medium">
                          {item.recipeComponent.name}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Expected: {item.requiredQty}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Actual: {item.actualQty ?? 0}
                        </p>

                        <p className="mt-2 text-xs font-medium">
                          {item.status === "GREEN"
                            ? "🟢 GREEN"
                            : item.status === "YELLOW"
                              ? "🟡 YELLOW"
                              : item.status === "RED"
                                ? "🔴 RED"
                                : "⚪ PENDING"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Rejected */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Recently Rejected
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Batches returned to Cutting for re-cutting.
            </p>
          </div>

          {rejectedOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
              No batches have been rejected.
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-red-900/50 bg-red-950/10 p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {order.batchNumber}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {order.recipe.styleCode} -{" "}
                        {order.recipe.styleName}
                      </p>

                      <p className="mt-2 text-sm text-red-300">
                        Reason:{" "}
                        {order.rejectionReason ??
                          "No rejection reason recorded"}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Decision by:{" "}
                        {order.verifiedBy?.name ?? "Unknown"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
                      🔴 REJECTED — RE-CUT REQUIRED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}