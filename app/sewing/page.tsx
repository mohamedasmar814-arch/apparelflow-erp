import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

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
  // Sewing can only retrieve batches that are READY.
  const readyOrders = await prisma.cuttingOrder.findMany({
    where: {
      status: "READY",
    },
    orderBy: {
      updatedAt: "asc",
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

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
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
            Only fully verified production batches are released to sewing.
          </p>
        </div>

        {readyOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">
              No batches ready for sewing
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Batches will appear here only after every required component
              passes verification.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {readyOrders.map((order) => (
              <section
                key={order.id}
                className="rounded-2xl border border-emerald-900/40 bg-slate-900 p-6"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {order.batchNumber}
                    </h2>

                    <p className="mt-1 text-slate-400">
                      {order.recipe.styleCode} - {order.recipe.styleName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Production Quantity: {order.quantity}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                    🟢 READY FOR SEWING
                  </span>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <h3 className="font-semibold text-white">
                    Verified Components
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {order.verificationItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <p className="font-medium text-white">
                          {item.recipeComponent.name}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          Required: {item.requiredQty}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Verified: {item.actualQty ?? 0}
                        </p>

                        <p className="mt-2 text-xs font-medium text-emerald-400">
                          🟢 {item.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}