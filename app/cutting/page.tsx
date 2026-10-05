import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import CuttingOrderForm from "./CuttingOrderForm";

export default async function CuttingPage() {
  const session = await getSession();

  // Authentication
  if (!session) {
    redirect("/login");
  }

  // Server-side role protection
  if (session.role !== "CUTTING") {
    redirect("/login");
  }

  // Load garment recipes from PostgreSQL
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

  // Load cutting orders from PostgreSQL
  const orders = await prisma.cuttingOrder.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      recipe: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Order Form */}
          <CuttingOrderForm recipes={recipes} />

          {/* Recent Orders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Cutting Orders
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Recent production batches and their current status.
            </p>

            <div className="mt-6 space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                  No cutting orders have been created yet.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">
                          {order.batchNumber}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {order.recipe.styleCode} -{" "}
                          {order.recipe.styleName}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Quantity: {order.quantity}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}