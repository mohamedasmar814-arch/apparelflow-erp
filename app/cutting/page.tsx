import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";

export default async function CuttingPage() {
  const session = await getSession();

  // User is not logged in
  if (!session) {
    redirect("/login");
  }

  // User is logged in but does not have Cutting permission
  if (session.role !== "CUTTING") {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-blue-400">
          ApparelFlow ERP
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Cutting Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Welcome, {session.name}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">
            Cutting Supervisor
          </h2>

          <p className="mt-2 text-slate-400">
            Cutting order management will be available here.
          </p>
        </div>
      </div>
    </main>
  );
}