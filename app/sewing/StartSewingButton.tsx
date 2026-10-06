"use client";

import { useState, useTransition } from "react";
import { startSewingAssembly } from "./actions";

type StartSewingButtonProps = {
  orderId: number;
};

export default function StartSewingButton({
  orderId,
}: StartSewingButtonProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStartSewing() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await startSewingAssembly(orderId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(
        result.success ?? "Sewing assembly started successfully."
      );
    });
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleStartSewing}
        disabled={isPending}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Starting Sewing Assembly..."
          : "Start Sewing Assembly"}
      </button>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-3 text-sm font-medium text-emerald-400">
          {success}
        </p>
      )}
    </div>
  );
}