"use client";

import { useActionState } from "react";
import {
  createCuttingOrder,
  type CuttingOrderState,
} from "./actions";

type RecipeOption = {
  id: number;
  styleCode: string;
  styleName: string;
};

type CuttingOrderFormProps = {
  recipes: RecipeOption[];
};

const initialState: CuttingOrderState = {
  error: "",
  success: "",
};

export default function CuttingOrderForm({
  recipes,
}: CuttingOrderFormProps) {
  const [state, formAction, pending] = useActionState(
    createCuttingOrder,
    initialState
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">
        Create Cutting Batch
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        Record the cutting details and send the batch for verification.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        {/* Batch Number */}
        <div>
          <label
            htmlFor="batchNumber"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Batch Number
          </label>

          <input
            id="batchNumber"
            name="batchNumber"
            type="text"
            required
            placeholder="Example: BATCH-001"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </div>

        {/* Recipe */}
        <div>
          <label
            htmlFor="recipeId"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Recipe ID
          </label>

          <select
            id="recipeId"
            name="recipeId"
            required
            defaultValue=""
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select a garment recipe
            </option>

            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.styleCode} - {recipe.styleName}
              </option>
            ))}
          </select>
        </div>

        {/* Target Batch Quantity */}
        <div>
          <label
            htmlFor="quantity"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Target Batch Quantity
          </label>

          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            required
            placeholder="Example: 100"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </div>

        {/* Fabric Roll ID */}
        <div>
          <label
            htmlFor="fabricRollId"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Fabric Roll ID
          </label>

          <input
            id="fabricRollId"
            name="fabricRollId"
            type="text"
            required
            placeholder="Example: ROLL-001"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </div>

        {/* Actual Fabric Used */}
        <div>
          <label
            htmlFor="actualFabricUsed"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Actual Fabric Used (yards)
          </label>

          <input
            id="actualFabricUsed"
            name="actualFabricUsed"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Example: 185.50"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Enter the total fabric actually consumed for this cutting batch.
          </p>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {state.error}
          </div>
        )}

        {/* Success Message */}
        {state.success && (
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
            {state.success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={pending || recipes.length === 0}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating Batch..."
            : "Create & Send for Verification"}
        </button>
      </form>
    </div>
  );
}