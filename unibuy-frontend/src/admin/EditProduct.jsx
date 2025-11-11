import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import {
  adminGetProductById,
  adminUpdateProduct,
  getCategoriesAdmin,
  getTags,
  createFile,
} from "../services/apiServices";
import Api from "../constants/Api";

const PLACEHOLDER = "https://via.placeholder.com/500x500?text=Product";
const toImageUrl = (file) => {
  const raw = file?.path || file?.url;
  if (!raw) return PLACEHOLDER;
  return `${Api.BACKEND_URL}${raw}`;
};

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  // queries
  const { data: product } = useSuspenseQuery({
    queryKey: ["admin-product", id],
    queryFn: () => adminGetProductById(id),
  });

  const { data: categories = [] } = useSuspenseQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategoriesAdmin,
  });

  const { data: tags = [] } = useSuspenseQuery({
    queryKey: ["admin-tags"],
    queryFn: getTags,
  });

  // mutations
  const { mutateAsync: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: createFile,
  });

  const { mutateAsync: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: adminUpdateProduct,
    onSuccess: () => navigate("/admin/products"),
  });

  // state
  const [name, setName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [tagIds, setTagIds] = useState([]);

  const [variants, setVariants] = useState([]);

  const [existingFiles, setExistingFiles] = useState([]); // product.files
  const [keptFileIds, setKeptFileIds] = useState([]); // IDs to keep
  const [newFiles, setNewFiles] = useState([]); // File[]
  const [newPreviews, setNewPreviews] = useState([]); // URLs

  // hydrate
  useEffect(() => {
    if (!product) return;
    setName(product.name || "");
    setShortDesc(product.shortDescription || "");
    setDescription(product.description || "");
    setPrice(product.price ?? "");
    setStock(product.stock ?? "");

    setCategoryIds(product.categories?.map((c) => c.id) || []);
    setTagIds(product.tags?.map((t) => t.id) || []);

    setVariants(Array.isArray(product.variants) ? product.variants : []);

    const files = product.files || [];
    setExistingFiles(files);
    setKeptFileIds(files.map((f) => f?.id).filter(Boolean));
  }, [product]);

  // helpers
  const toggleFromArray = (arr, setArr, _id) =>
    setArr(arr.includes(_id) ? arr.filter((x) => x !== _id) : [...arr, _id]);

  const handleNewFiles = (e) => {
    const f = Array.from(e.target.files || []);
    if (!f.length) return;
    setNewFiles((prev) => [...prev, ...f]);
    setNewPreviews((prev) => [...prev, ...f.map((x) => URL.createObjectURL(x))]);
  };

  const removeExistingFile = (fid) => {
    setKeptFileIds((prev) => prev.filter((x) => x !== fid));
  };

  const removeNewFileAt = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // variants
  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      { optionType: "", optionValue: "", price: "", stock: "", sku: "", imageUrl: "" },
    ]);

  const updateVariant = (i, key, val) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [key]: val };
      return copy;
    });
  };

  const removeVariant = (i) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // upload new files
      const uploadedIds = [];
      for (const file of newFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "ProductImage");
        const res = await uploadFile(fd);
        if (res?.id) uploadedIds.push(res.id);
      }
      const fileIds = [...keptFileIds, ...uploadedIds].filter(Boolean);

      // clean variants
      const cleanVariants = (variants || [])
        .map((v) => ({
          optionType: v.optionType?.trim() || undefined,
          optionValue: v.optionValue?.trim() || undefined,
          price:
            v.price === "" || v.price === undefined ? undefined : Number(v.price),
          stock:
            v.stock === "" || v.stock === undefined ? undefined : Number(v.stock),
          sku: v.sku?.trim() || undefined,
          imageUrl: v.imageUrl?.trim() || undefined,
        }))
        .filter(
          (v) =>
            v.optionType ||
            v.optionValue ||
            v.price !== undefined ||
            v.stock !== undefined ||
            v.sku ||
            v.imageUrl
        );

      const payload = {
        id,
        name,
        shortDescription: shortDesc,
        description,
        price: Number(price || 0),
        stock: Number(stock || 0),
        categoryIds,
        tagIds,
      };
      if (fileIds.length) payload.fileIds = fileIds;
      if (cleanVariants.length) payload.variants = cleanVariants; // NOTE: backend should replace variants

      await updateProduct(payload);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update product. See console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex justify-center items-start py-10 px-4">
      <div className="w-full bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          ✏️ Edit Product
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Short summary…"
              rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a detailed description…"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 999"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleFromArray(categoryIds, setCategoryIds, cat.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                    categoryIds.includes(cat.id)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleFromArray(tagIds, setTagIds, tag.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                    tagIds.includes(tag.id)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Product Variants</p>
              <button
                type="button"
                onClick={addVariant}
                className="text-indigo-600 text-sm hover:underline"
              >
                + Add Variant
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-xs text-gray-500">
                Example: Color (Black, Blue) | Storage (64GB, 128GB)
              </p>
            )}

            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-6 gap-3 mt-2">
                <input
                  type="text"
                  placeholder="Option Type"
                  value={v.optionType || ""}
                  onChange={(e) => updateVariant(i, "optionType", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Option Value"
                  value={v.optionValue || ""}
                  onChange={(e) => updateVariant(i, "optionValue", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price || ""}
                  onChange={(e) => updateVariant(i, "price", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock || ""}
                  onChange={(e) => updateVariant(i, "stock", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={v.sku || ""}
                  onChange={(e) => updateVariant(i, "sku", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Images (existing + new) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images
            </label>

            {/* Existing */}
            {existingFiles.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  Click “Remove” to exclude an image from this product.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {existingFiles.map((f) => {
                    const fid = f?.id;
                    const active = fid && keptFileIds.includes(fid);
                    return (
                      <div
                        key={fid || Math.random()}
                        className={`relative rounded-lg border ${
                          active ? "border-gray-200" : "border-rose-200"
                        } bg-gray-50`}
                      >
                        <div className="aspect-square w-full overflow-hidden">
                          <img
                            src={toImageUrl(f)}
                            alt="Existing"
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                        <div className="p-2">
                          {active ? (
                            <button
                              type="button"
                              onClick={() => fid && removeExistingFile(fid)}
                              disabled={!fid}
                              className={`w-full rounded-md border px-2 py-1 text-xs font-medium ${
                                fid
                                  ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fid && setKeptFileIds((prev) => [...prev, fid])}
                              disabled={!fid}
                              className={`w-full rounded-md border px-2 py-1 text-xs font-semibold ${
                                fid
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Keep
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* New uploads */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewFiles}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              {newPreviews.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFiles([]);
                    setNewPreviews([]);
                  }}
                  className="text-xs text-rose-600 font-medium hover:text-rose-700"
                >
                  Remove all new
                </button>
              )}
            </div>

            {newPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {newPreviews.map((url, idx) => (
                  <div key={idx} className="relative rounded-lg border border-gray-200 bg-gray-50">
                    <div className="aspect-square w-full overflow-hidden">
                      <img src={url} alt="Preview" className="h-full w-full object-contain p-2" />
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() => removeNewFileAt(idx)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUpdating || isUploading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUpdating || isUploading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
