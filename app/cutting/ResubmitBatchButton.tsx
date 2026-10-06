"use client";

import { useState, useTransition } from "react";
import { resubmitRejectedBatch } from "./actions";

type ResubmitBatchButtonProps = {
  orderId: number;
};

export default function ResubmitBatchButton({
  orderId,
}: ResubmitBatchButtonProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleResubmit() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await resubmitRejectedBatch(orderId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success);
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleResubmit}
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? "Resubmitting..."
          : "Re-cut Complete — Resubmit for Verification"}
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