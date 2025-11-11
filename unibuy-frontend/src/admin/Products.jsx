import React, { useState, useMemo } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import {
  getProductsAdmin,
  getCategoriesAdmin,
  getTags,
  deleteProductAdmin,
} from "../services/apiServices";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";
import Api from "../constants/Api";

const placeholder = "https://via.placeholder.com/500x500?text=Product";
const getProductImage = (p) => {
  const file = p?.files?.[0];
  const raw = file?.path;
  if (raw) {
    return `${Api.BACKEND_URL}${raw}`;
  }
  return p?.imageUrl || placeholder;
};

export default function Products() {
  const { data: products, refetch, isLoading } = useSuspenseQuery({
    queryKey: ["admin-products"],
    queryFn: getProductsAdmin,
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategoriesAdmin,
  });

  const { data: tags } = useSuspenseQuery({
    queryKey: ["admin-tags"],
    queryFn: getTags,
  });

  const { mutateAsync: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: deleteProductAdmin,
    onSuccess: refetch,
  });

  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleFilter = (id, setFunc, selected) => {
    setFunc(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products || [];
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase?.().includes(term) ||
          p.description?.toLowerCase?.().includes(term)
      );
    }
    if (selectedCats.length > 0) {
      filtered = filtered.filter((p) =>
        p.categories?.some?.((c) => selectedCats.includes(c.id))
      );
    }
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        p.tags?.some?.((t) => selectedTags.includes(t.id))
      );
    }
    return filtered;
  }, [products, search, selectedCats, selectedTags]);

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 text-sm">
            {filteredProducts?.length || 0} item
            {(filteredProducts?.length || 0) === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to="add"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold shadow hover:bg-indigo-700 transition"
        >
          + Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-4 focus:ring-indigo-100"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28h.79L20 21.5 21.5 20 15.5 14Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"
              />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleFilter(cat.id, setSelectedCats, selectedCats)}
                className={`px-3 py-1 text-sm rounded-lg font-medium border transition ${
                  selectedCats.includes(cat.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter */}
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags?.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleFilter(tag.id, setSelectedTags, selectedTags)}
                className={`px-3 py-1 text-sm rounded-lg font-medium border transition ${
                  selectedTags.includes(tag.id)
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Inventory</th>
              <th className="px-4 py-3 text-left">Categories</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const imageSrc = getProductImage(p);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    {/* Product Info */}
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={imageSrc}
                        alt={p.name}
                        className="w-12 h-12 rounded object-cover border border-gray-200"
                        onError={(e) => (e.currentTarget.src = placeholder)}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          ₹{Number(p.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.stock > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        {p.stock > 0 ? "Active" : "Out of Stock"}
                      </span>
                    </td>

                    {/* Inventory */}
                    <td className="px-4 py-3 text-gray-700">
                      {p.stock} in stock
                    </td>

                    {/* Categories */}
                    <td className="px-4 py-3 text-gray-700">
                      {p.categories?.length
                        ? p.categories.map((c) => c.name).join(", ")
                        : "—"}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3 text-gray-700">
                      {p.tags?.length
                        ? p.tags.map((t) => t.name).join(", ")
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`${p.id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          disabled={isDeleting}
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium disabled:opacity-60"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-500 text-sm">
                  No products found. Try adjusting filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
