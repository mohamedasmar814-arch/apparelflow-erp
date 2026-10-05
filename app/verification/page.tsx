import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import VerificationItemForm from "./VerificationItemForm";

export default async function VerificationPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "VERIFICATION") {
    redirect("/login");
  }

  // Batches that still need verification
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

  // Recently completed verification batches
  const readyOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "READY",
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
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

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
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

        {/* Waiting for Verification */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Waiting for Verification
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Cutting batches that still require component verification.
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
              {pendingOrders.map((order) => (
                <section
                  key={order.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
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

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {order.verificationItems.map((item) => {
                      const statusStyle =
                        item.status === "VERIFIED"
                          ? "border-emerald-900/50 bg-emerald-950/20"
                          : item.status === "SHORTAGE"
                          ? "border-red-900/50 bg-red-950/20"
                          : "border-amber-900/50 bg-amber-950/20";

                      const statusLabel =
                        item.status === "VERIFIED"
                          ? "🟢 VERIFIED"
                          : item.status === "SHORTAGE"
                          ? "🔴 SHORTAGE"
                          : "🟡 PENDING";

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
                                Required: {item.requiredQty}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Actual:{" "}
                                {item.actualQty ?? "Not checked"}
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
                </section>
              ))}
            </div>
          )}
        </section>

        {/* Recently Verified */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Recently Verified
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Completed batches that have been released to the Sewing Queue.
            </p>
          </div>

          {readyOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
              No batches have completed verification yet.
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
                    </div>

                    <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                      🟢 READY FOR SEWING
                    </span>
                  </div>

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
                          Required: {item.requiredQty}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Verified: {item.actualQty ?? 0}
                        </p>

                        <p className="mt-2 text-xs font-medium text-emerald-400">
                          🟢 VERIFIED
                        </p>
                      </div>
                    ))}
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