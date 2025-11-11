import React, { useEffect, useState, useCallback } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { useDropzone } from "react-dropzone";
import {
  createFile,
  createProductAdmin,
  getCategoriesAdmin,
  getTags,
} from "../services/apiServices";
import { useNavigate } from "react-router-dom";

export default function AddProduct() {
  const navigate = useNavigate();

  // Restore saved form (persistence)
  const savedForm = JSON.parse(localStorage.getItem("addProductForm") || "{}");

  const [title, setTitle] = useState(savedForm.title || "");
  const [shortDesc, setShortDesc] = useState(savedForm.shortDesc || "");
  const [description, setDescription] = useState(savedForm.description || "");
  const [price, setPrice] = useState(savedForm.price || "");
  const [stock, setStock] = useState(savedForm.stock || "");
  const [categoryIds, setCategoryIds] = useState(savedForm.categoryIds || []);
  const [tagIds, setTagIds] = useState(savedForm.tagIds || []);
  const [variants, setVariants] = useState(savedForm.variants || []);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  /** React Query hooks */
  const { data: categories } = useSuspenseQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategoriesAdmin,
  });

  const { data: tags } = useSuspenseQuery({
    queryKey: ["admin-tags"],
    queryFn: getTags,
  });

  const { mutateAsync: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: createFile,
  });

  const { mutateAsync: createProduct, isPending: isCreating } = useMutation({
    mutationFn: createProductAdmin,
    onSuccess: () => {
      localStorage.removeItem("addProductForm");
      navigate("/admin/products");
    },
  });

  /** Auto-save form */
  useEffect(() => {
    localStorage.setItem(
      "addProductForm",
      JSON.stringify({
        title,
        shortDesc,
        description,
        price,
        stock,
        categoryIds,
        tagIds,
        variants,
      })
    );
  }, [title, shortDesc, description, price, stock, categoryIds, tagIds, variants]);

  /** Dropzone for images */
  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  /** Category / Tag selection */
  const toggleSelect = (setter, selected, id) =>
    setter(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  /** Variant Handlers */
  const addVariant = () =>
    setVariants([
      ...variants,
      { optionType: "", optionValue: "", price: "", stock: "", sku: "", imageUrl: "" },
    ]);

  const updateVariant = (index, key, value) => {
    const copy = [...variants];
    copy[index][key] = value;
    setVariants(copy);
  };

  const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i));

  /** Submit form */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1️⃣ Upload all images
      const uploadedFileIds = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "ProductImage");
        const res = await uploadFile(formData);
        uploadedFileIds.push(res?.id);
      }

      // 2️⃣ Submit product
      await createProduct({
        name: title,
        shortDescription: shortDesc,
        description,
        price: Number(price),
        stock: Number(stock),
        categoryIds,
        tagIds,
        fileIds: uploadedFileIds,
        variants, // JSON array of variant objects
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create product.");
    }
  };

  const clearMedia = () => {
    setFiles([]);
    setPreviews([]);
  };

  /** ---------------- UI ---------------- */
  return (
    <div className="min-h-screen py-10 px-4 flex justify-center">
      <div className="w-full bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🛍️ Add New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
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
              placeholder="A quick highlight or tagline..."
              rows="2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Description
            </label>
            <Editor
              tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@6.8.2/tinymce.min.js"
              value={description}
              onEditorChange={setDescription}
              init={{
                height: 300,
                menubar: false,
                plugins:
                  "link image lists preview code fullscreen table",
                toolbar:
                  "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist outdent indent | link image | preview code fullscreen",
              }}
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
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleSelect(setCategoryIds, categoryIds, cat.id)}
                  className={`px-3 py-1 rounded-lg text-sm border transition ${
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
            <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleSelect(setTagIds, tagIds, tag.id)}
                  className={`px-3 py-1 rounded-lg text-sm border transition ${
                    tagIds.includes(tag.id)
                      ? "bg-green-600 text-white border-green-600"
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
                  placeholder="Option Type (e.g. Color)"
                  value={v.optionType || ""}
                  onChange={(e) => updateVariant(i, "optionType", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Option Value (e.g. Black)"
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

          {/* Media */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Media</p>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-indigo-600 font-medium">Drop your files here...</p>
              ) : (
                <p className="text-gray-500">
                  Drag & drop images here, or click to select files
                </p>
              )}
            </div>

            {previews.length > 0 && (
              <>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previews.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preview"
                      className="h-32 w-full object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearMedia}
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                >
                  Remove All
                </button>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || isUploading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold shadow-md hover:from-indigo-700 hover:to-blue-700 transition disabled:opacity-70"
          >
            {isCreating || isUploading ? "Processing..." : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
