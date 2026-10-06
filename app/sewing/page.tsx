import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { logoutAction } from "../logout/actions";
import StartSewingButton from "./StartSewingButton";

export default async function SewingPage() {
  const session = await getSession();

  // Authentication
  if (!session) {
    redirect("/login");
  }

  // Server-side RBAC
  if (session.role !== "SEWING") {
    redirect("/login");
  }

  // HARD STOP:
  // Sewing retrieves only batches that have been explicitly
  // approved and moved to READY status.
  //
  // This filtering happens at the database-query level,
  // not only in the user interface.
  const readyOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "READY",
    },
    orderBy: {
      updatedAt: "asc",
    },
    include: {
      recipe: true,

      // Required for verifier attribution
      verifiedBy: true,

      verificationItems: {
        include: {
          recipeComponent: true,
        },
      },
    },
  });

  // Format timestamps explicitly in Sri Lanka time.
  // This keeps the displayed time consistent after cloud deployment.
  const formatSriLankaDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-400">
              ApparelFlow ERP
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Sewing Queue
            </h1>

            <p className="mt-2 text-slate-400">
              Welcome, {session.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Only explicitly approved production batches are
              released to the Sewing Queue.
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

        {/* Empty Queue */}
        {readyOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">
              No batches ready for sewing
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              A batch will appear here only after verification is
              completed and the Cutting Verifier explicitly
              approves it.
            </p>
          </div>
        ) : (
          /* Sewing Queue */
          <div className="space-y-6">
            {readyOrders.map((order) => (
              <section
                key={order.id}
                className="rounded-2xl border border-emerald-900/40 bg-slate-900 p-6"
              >
                {/* Batch Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {order.batchNumber}
                    </h2>

                    <p className="mt-1 text-slate-400">
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

                {/* Batch Information */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Fabric Roll ID
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {order.fabricRollId}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Actual Fabric Used
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {order.actualFabricUsed.toFixed(2)} yds
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Verified By
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {order.verifiedBy?.name ??
                        "Verifier unavailable"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Verified At
                    </p>

                    <p className="mt-1 text-sm font-medium text-white">
                      {order.verifiedAt
                        ? formatSriLankaDateTime(order.verifiedAt)
                        : "Verification time unavailable"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Sri Lanka Time
                    </p>
                  </div>
                </div>

                {/* Verified Components */}
                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h3 className="font-semibold text-white">
                    Verified Components
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    GREEN means the quantity exactly matches the
                    expected quantity. YELLOW means excess quantity
                    was recorded and is allowed to proceed.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {order.verificationItems.map((item) => {
                      const statusStyle =
                        item.status === "GREEN"
                          ? "text-emerald-400"
                          : item.status === "YELLOW"
                            ? "text-amber-400"
                            : item.status === "RED"
                              ? "text-red-400"
                              : "text-slate-400";

                      const statusIcon =
                        item.status === "GREEN"
                          ? "🟢"
                          : item.status === "YELLOW"
                            ? "🟡"
                            : item.status === "RED"
                              ? "🔴"
                              : "⚪";

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                        >
                          <p className="font-medium text-white">
                            {item.recipeComponent.name}
                          </p>

                          <p className="mt-2 text-sm text-slate-400">
                            Expected: {item.requiredQty}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Actual: {item.actualQty ?? 0}
                          </p>

                          <p
                            className={`mt-2 text-xs font-medium ${statusStyle}`}
                          >
                            {statusIcon} {item.status}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gatekeeper Confirmation */}
                <div className="mt-6 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                  <p className="text-sm font-semibold text-emerald-300">
                    Verification Gate Passed
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    This batch was explicitly approved by the
                    Cutting Verifier and is eligible to begin
                    sewing assembly.
                  </p>
                </div>

                {/* Start Sewing */}
                <StartSewingButton orderId={order.id} />
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
