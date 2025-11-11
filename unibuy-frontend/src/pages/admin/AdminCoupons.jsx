import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoupons, createCoupon, deleteCoupon } from "../../services/apiServices";
import Loader from "../../components/Loader";

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: getCoupons,
  });

  const coupons = Array.isArray(couponsData) ? couponsData : [];

  const [form, setForm] = useState({
    code: "",
    discountPct: "",
    expiresAt: "",
    usageLimit: "1", // default single-use
  });

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries(["coupons"]);
      setForm({ code: "", discountPct: "", expiresAt: "", usageLimit: "1" });
      alert("✅ Coupon created successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries(["coupons"]);
      alert("🗑️ Coupon deleted successfully!");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.discountPct)
      return alert("Please fill required fields");
    createMutation.mutate({
      ...form,
      usageLimit: Number(form.usageLimit) || 1,
    });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        🎟️ Manage Coupons
      </h2>

      {/* Coupon Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-200 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Coupon Code *
            </label>
            <input
              type="text"
              placeholder="e.g. SAVE10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full rounded-md border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Discount (%) *
            </label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={form.discountPct}
              onChange={(e) =>
                setForm({ ...form, discountPct: e.target.value })
              }
              className="w-full rounded-md border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-md border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Usage Limit{" "}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (Enter <b>99999</b> for unlimited)
              </span>
            </label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              className="w-full rounded-md border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {createMutation.isPending ? "Adding..." : "Add Coupon"}
        </button>
      </form>

      {/* Coupon List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Existing Coupons
        </h3>

        {coupons.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No coupons added yet.
          </p>
        ) : (
          <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm">
              <tr>
                <th className="py-3 px-4 text-left">Code</th>
                <th className="py-3 px-4 text-left">Discount</th>
                <th className="py-3 px-4 text-left">Usage Limit</th>
                <th className="py-3 px-4 text-left">Expiry</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 dark:text-gray-300">
              {coupons.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="py-2 px-4 font-semibold">{c.code}</td>
                  <td className="py-2 px-4">{c.discountPct}%</td>
                  <td className="py-2 px-4">
                    {c.usageLimit >= 99999 ? "Unlimited" : c.usageLimit}
                  </td>
                  <td className="py-2 px-4">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString()
                      : "No expiry"}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={() =>
                        window.confirm("Delete this coupon?") &&
                        deleteMutation.mutate(c.id)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
