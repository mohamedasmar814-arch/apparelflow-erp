"use client";

import { useState, useTransition } from "react";
import { approveBatch, rejectBatch } from "./actions";

type BatchDecisionFormProps = {
  orderId: number;
  hasRed: boolean;
  hasPending: boolean;
};

export default function BatchDecisionForm({
  orderId,
  hasRed,
  hasPending,
}: BatchDecisionFormProps) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const approvalBlocked = hasRed || hasPending;

  function handleApprove() {
    setMessage("");
    setError("");

    startTransition(async () => {
      const result = await approveBatch(orderId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.success);
    });
  }

  function handleReject() {
    setMessage("");
    setError("");

    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    startTransition(async () => {
      const result = await rejectBatch(orderId, reason);

      if (result.error) {
        setError(result.error);
        return;
      }

      setReason("");
      setMessage(result.success);
    });
  }

  return (
    <div className="mt-6 border-t border-slate-800 pt-5">
      <h4 className="font-semibold text-white">
        Gatekeeper Decision
      </h4>

      <p className="mt-1 text-sm text-slate-400">
        Approve the batch for sewing or reject it for re-cutting.
      </p>

      {hasRed && (
        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
          🔴 Approval blocked. At least one component has a shortage.
        </div>
      )}

      {!hasRed && hasPending && (
        <div className="mt-4 rounded-xl border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-300">
          🟡 Complete all component checks before approving this batch.
        </div>
      )}

      {!hasRed && !hasPending && (
        <div className="mt-4 rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-300">
          🟢 All components are eligible. Final approval is available.
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor={`rejectionReason-${orderId}`}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Rejection Reason
        </label>

        <textarea
          id={`rejectionReason-${orderId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required when rejecting a batch..."
          rows={3}
          disabled={isPending}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500 disabled:opacity-50"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleApprove}
          disabled={approvalBlocked || isPending}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {isPending ? "Processing..." : "Approve Batch"}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Reject Batch"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 text-sm font-medium text-emerald-400">
          {message}
        </p>
      )}
    </div>
  );
}