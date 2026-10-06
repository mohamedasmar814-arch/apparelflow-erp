"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {
  error: "",
};

type DemoRole = {
  title: string;
  description: string;
  email: string;
  icon: string;
};

const demoRoles: DemoRole[] = [
  {
    title: "Cutting Supervisor",
    description: "Create cutting batches and send them for verification.",
    email: "cutting@apparelflow.com",
    icon: "✂️",
  },
  {
    title: "Verification Officer",
    description: "Verify components and approve or reject production batches.",
    email: "verification@apparelflow.com",
    icon: "✅",
  },
  {
    title: "Sewing Supervisor",
    description: "View approved batches and start sewing assembly.",
    email: "sewing@apparelflow.com",
    icon: "🧵",
  },
];

const DEMO_PASSWORD = "ApparelFlow123!";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state.redirectTo]);

  function selectDemoRole(role: DemoRole) {
    setEmail(role.email);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg">
            A
          </div>

          <h1 className="text-3xl font-bold text-white">
            ApparelFlow ERP
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Garment Production Workflow Management
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Login */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Sign in
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter your account details or select a demo role.
            </p>

            <form action={formAction} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@apparelflow.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={pending}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              {state.error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending || Boolean(state.redirectTo)}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending || state.redirectTo
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Demo Password
              </p>

              <p className="mt-2 font-mono text-sm text-slate-300">
                {DEMO_PASSWORD}
              </p>
            </div>
          </div>

          {/* Demo role selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                Demo Role Access
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Select a role to fill the demo credentials automatically.
              </p>
            </div>

            <div className="space-y-4">
              {demoRoles.map((role) => {
                const selected = email === role.email;

                return (
                  <button
                    key={role.email}
                    type="button"
                    onClick={() => selectDemoRole(role)}
                    disabled={pending}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-800"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
                        {role.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {role.title}
                          </h3>

                          {selected && (
                            <span className="rounded-full bg-blue-500/15 px-2 py-1 text-xs font-medium text-blue-300">
                              Selected
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {role.description}
                        </p>

                        <p className="mt-2 break-all font-mono text-xs text-slate-500">
                          {role.email}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
              <p className="text-sm font-medium text-emerald-300">
                Role-Based Access Control
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Each account is restricted to its authorized production
                workflow. Server-side authorization is enforced after login.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          ApparelFlow ERP • Production Management System
        </p>
      </div>
    </main>
  );
}