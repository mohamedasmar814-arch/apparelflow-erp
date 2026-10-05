"use client";

import { useActionState } from "react";
import {
  verifyComponent,
  type VerificationState,
} from "./actions";

type VerificationItemFormProps = {
  itemId: number;
  currentActualQty: number | null;
};

const initialState: VerificationState = {
  error: "",
  success: "",
};

export default function VerificationItemForm({
  itemId,
  currentActualQty,
}: VerificationItemFormProps) {
  const [state, formAction, pending] = useActionState(
    verifyComponent,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="hidden"
        name="verificationItemId"
        value={itemId}
      />

      <div className="flex gap-2">
        <input
          name="actualQty"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={currentActualQty ?? ""}
          placeholder="Actual quantity"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Verify"}
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-red-400">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="text-xs text-emerald-400">
          {state.success}
        </p>
      )}
    </form>
  );
}