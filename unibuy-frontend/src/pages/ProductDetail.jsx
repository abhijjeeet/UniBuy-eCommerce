import React, { useState, useMemo, useEffect, startTransition } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addToCart,
  getProductById,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllProducts,
  getCoupons,
} from "../services/apiServices";
import Api from "../constants/Api";
import { addToGuestCart } from "../utils/cartStorage";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import { Heart, HeartCrack, ShoppingCart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  /* ----------------------------- Product detail ---------------------------- */
  const { data: product, isPending: isLoading } = useSuspenseQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
  });

  /* ---------------------------- Non-suspense queries ---------------------------- */
  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: token ? getWishlist : () => [],
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: getCoupons,
  });

  const [mainImage, setMainImage] = useState(null);
  const [adding, setAdding] = useState(false);

  /* ----------------------------- Wishlist logic ----------------------------- */
  const item = wishlist.find((w) => w.productId === product?.id);

  const addWishlistMutation = useMutation({
    mutationFn: async () => addToWishlist({ productId: product.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    onError: (err) => alert(err?.message || "Failed to add to wishlist"),
  });

  const removeWishlistMutation = useMutation({
    mutationFn: async (it) => {
      if (!it?.id) throw new Error("Item not found in wishlist");
      return removeFromWishlist(it.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
    onError: (err) => alert(err?.message || "Failed to remove from wishlist"),
  });

  /* ------------------------------ Variants logic ------------------------------ */
  // Backend gives: product.variants: [{id, optionType, optionValue, price?, stock?, sku?, imageUrl?}, ...]
  const variants = product?.variants || [];

  // Group values by optionType -> unique optionValue list with attached rows
  const groupedOptions = useMemo(() => {
    const map = new Map(); // optionType -> { value -> rows[] }
    for (const v of variants) {
      const type = (v.optionType || "").trim();
      const val = (v.optionValue || "").trim();
      if (!type || !val) continue;
      if (!map.has(type)) map.set(type, new Map());
      const valMap = map.get(type);
      if (!valMap.has(val)) valMap.set(val, []);
      valMap.get(val).push(v);
    }
    // convert to object: { [type]: [{value, rows}] }
    const out = {};
    for (const [type, valMap] of map.entries()) {
      out[type] = Array.from(valMap.entries()).map(([value, rows]) => ({ value, rows }));
    }
    return out;
  }, [variants]);

  // Default selection: first value for each type
  const initialSelection = useMemo(() => {
    const sel = {};
    Object.keys(groupedOptions).forEach((type) => {
      if (groupedOptions[type]?.length) sel[type] = groupedOptions[type][0].value;
    });
    return sel;
  }, [groupedOptions]);

  const [selection, setSelection] = useState(initialSelection);

  // Keep selection in sync when product/variants change
  useEffect(() => {
    setSelection((prev) => {
      const next = { ...prev };
      for (const type of Object.keys(groupedOptions)) {
        const values = groupedOptions[type]?.map((o) => o.value) || [];
        if (!values.length) {
          delete next[type];
          continue;
        }
        if (!values.includes(next[type])) next[type] = values[0];
      }
      // drop removed types
      Object.keys(next).forEach((t) => {
        if (!groupedOptions[t]) delete next[t];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, JSON.stringify(groupedOptions)]);

  // Selected rows by optionType
  const selectedRows = useMemo(() => {
    const rows = [];
    for (const [type, chosen] of Object.entries(selection)) {
      const list = groupedOptions[type] || [];
      const bucket = list.find((o) => o.value === chosen);
      if (bucket?.rows?.length) rows.push(bucket.rows[0]); // pick first row for that value
    }
    return rows;
  }, [selection, groupedOptions]);

  // Price/stock/image overrides from selected rows (first non-null wins)
  const effectivePrice =
    selectedRows.find((r) => typeof r.price === "number")?.price ?? product?.price ?? 0;

  const effectiveStock =
    selectedRows.find((r) => typeof r.stock === "number")?.stock ?? product?.stock ?? 0;

  const variantImage =
    selectedRows.find((r) => r.imageUrl)?.imageUrl || null;

  const variantImageAbs = variantImage
    ? variantImage.startsWith("http")
      ? variantImage
      : `${Api.BACKEND_URL}${variantImage.replace(/\\/g, "/")}`
    : null;

  /* -------------------------------- Images -------------------------------- */
  const baseImageList =
    product?.files?.map((f) => `${Api.BACKEND_URL}${f.path.replace(/\\/g, "/")}`) || [];
  const imageList = variantImageAbs
    ? [variantImageAbs, ...baseImageList.filter((x) => x !== variantImageAbs)]
    : baseImageList;
  const displayImage =
    mainImage || imageList[0] || product.imageUrl || "https://via.placeholder.com/600x400";

  /* ------------------------------- Add to cart ------------------------------ */
  // const handleAddToCart = async () => {
  //   setAdding(true);
  //   try {
  //     const payload = {
  //       productId: product.id,
  //       quantity: 1,
  //       // include variant metadata (backend can choose to use any/all)
  //       // variantIds: selectedRows.map((r) => r.id),
  //       // variantSelection: selection,
  //     };

  //     startTransition(async () => {
  //       if (token) {
  //         await addToCart(payload);
  //       } else {
  //         addToGuestCart(
  //           {
  //             id: product.id,
  //             name: product.name,
  //             // store the resolved price so cart is consistent with UI
  //             price: effectivePrice,
  //             description: product.description,
  //             files: product.files,
  //             // variantIds: payload.variantIds,
  //             // variantSelection: payload.variantSelection,
  //             // imageUrl: variantImageAbs || product.imageUrl || imageList[0],
  //             sku: selectedRows.find((r) => r.sku)?.sku || undefined,
  //           },
  //           1
  //         );
  //       }
  //       setTimeout(() => setAdding(false), 500);
  //     });
  //   } catch (error) {
  //     console.error("Add to cart error:", error);
  //     alert("❌ Failed to add item to cart.");
  //     setTimeout(() => setAdding(false), 500);
  //   }
  // };


  const handleAddToCart = async () => {
  setAdding(true);
  try {
    const selectedVariant = selectedRows?.[0] || null;
    const variantId = selectedVariant?.id || null;

    const payload = {
      productId: product.id,
      quantity: 1,
      variantId,
      variantSelection: selection,
      sku: selectedVariant?.sku || null,
    };

    startTransition(async () => {
      if (token) {
        await addToCart(payload);
      } else {
        addToGuestCart(
          {
            id: product.id,
            name: product.name,
            price: effectivePrice,
            description: product.description,
            files: product.files,
            sku: payload.sku,
            variantSelection: payload.variantSelection,
            imageUrl: variantImageAbs || product.imageUrl || imageList[0],
          },
          1,
          variantId
        );
      }

      // ✅ reload page after add
      setTimeout(() => {
        setAdding(false);
        window.location.reload(); // refreshes the current page
      }, 500);
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    alert("❌ Failed to add item to cart.");
    setTimeout(() => setAdding(false), 500);
  }
};



  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (isLoading) return <Loader />;
  if (!product) return <p className="text-center py-10 text-gray-600">Product not found.</p>;

  const inr = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
      Number(n || 0)
    );

  return (
    <section className="bg-[#f9fafb] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* 🧭 Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-5">
          <div className="flex items-center gap-1">
            <Link to="/" className="hover:text-blue-600">Home</Link> /
            <Link to="/shop" className="hover:text-blue-600 ml-1">Shop</Link> /
            <span className="text-gray-800 font-medium ml-1 line-clamp-1">{product.name}</span>
          </div>
        </nav>

        {/* Main layout */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* 🖼 Image gallery */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-4 relative">
              {effectiveStock <= 0 && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  Out of Stock
                </span>
              )}
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-[420px] object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>

            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 rounded-md border-2 ${
                      mainImage === img ? "border-blue-600" : "border-gray-200"
                    } hover:border-blue-400 transition-all`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 📄 Info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* ⭐ Rating */}
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                <span>{product.rating?.toFixed?.(1) || "4.3"}</span>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24..." />
                </svg>
              </div>
              <span className="text-sm text-gray-500">
                {product.reviews || 14215} Ratings & Reviews
              </span>
            </div>

            {/* 🎛 Variant selectors */}
            {Object.keys(groupedOptions).length > 0 && (
              <div className="space-y-3 pt-1">
                {Object.entries(groupedOptions).map(([type, values]) => (
                  <div key={type}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{type}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map(({ value }) => {
                        const selected = selection[type] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setSelection((prev) => ({ ...prev, [type]: value }));
                              const row =
                                variants.find(
                                  (r) => r.optionType?.trim() === type && r.optionValue?.trim() === value
                                ) || null;
                              if (row?.imageUrl) {
                                const abs = row.imageUrl.startsWith("http")
                                  ? row.imageUrl
                                  : `${Api.BACKEND_URL}${row.imageUrl.replace(/\\/g, "/")}`;
                                setMainImage(abs);
                              }
                            }}
                            className={`px-3 py-1 rounded-lg text-sm border transition ${
                              selected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 💰 Price */}
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-gray-900">{inr(effectivePrice)}</p>
              {product.mrp && product.mrp > effectivePrice && (
                <>
                  <p className="line-through text-gray-400 text-lg">{inr(product.mrp)}</p>
                  <span className="text-green-600 text-sm font-semibold">
                    {Math.round(((product.mrp - effectivePrice) / product.mrp) * 100)}% off
                  </span>
                </>
              )}
            </div>

            {/* 🎟 Coupons */}
            {coupons.length > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <h4 className="font-semibold text-blue-800 mb-2">Available Coupons</h4>
                <div className="flex flex-wrap gap-2">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-dashed border-blue-300 text-blue-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-50 transition"
                    >
                      {c.code} — {c.discount}% OFF
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ❤️ + 🛒 Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              {/* ❤️ Add / Remove Wishlist */}
              {!item ? (
                <button
                  onClick={() => {
                    if (!token) {
                      navigate("/login");
                      return;
                    }
                    addWishlistMutation.mutate();
                  }}
                  disabled={addWishlistMutation.isPending}
                  className="flex-1 py-3 font-semibold rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {addWishlistMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <SpinnerGray /> Adding...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Heart /> Add to Wishlist
                    </div>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => removeWishlistMutation.mutate(item)}
                  disabled={removeWishlistMutation.isPending}
                  className="flex-1 py-3 font-semibold rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                >
                  {removeWishlistMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <SpinnerRed /> Removing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <HeartCrack /> Remove from Wishlist
                    </div>
                  )}
                </button>
              )}

              {/* 🛒 Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={adding || effectiveStock <= 0}
                className={`flex-1 font-semibold text-white py-3 rounded-md transition ${
                  adding || effectiveStock <= 0
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {adding ? (
                  <div className="flex items-center justify-center gap-2">
                    <SpinnerWhite /> Adding...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingCart /> {effectiveStock > 0 ? "Add to Cart" : "Out of Stock"}
                  </div>
                )}
              </button>
            </div>

            {/* 📝 Description (short + full) */}
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Product Description</h3>
              <div className="text-gray-700 space-y-2 leading-relaxed">
                {product.description
                  ? <p>{String(product.description).slice(0, 500)}...</p>
                  : <p>No description available.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Full description section */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Product Description</h3>
          <div className="text-gray-700 space-y-2 leading-relaxed">
            {product.description
              ? String(product.description)
                  .split("\n")
                  .map((l, i) => <p key={i}>{l}</p>)
              : <p>No description available.</p>}
          </div>
        </div>

        <RelatedProducts currentId={product.id} currentCategories={product.categories} />
      </div>
    </section>
  );
}

function SpinnerGray() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  );
}
function SpinnerRed() {
  return (
    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  );
}
function SpinnerWhite() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
  );
}

/* ======================= Related Products ======================= */
function RelatedProducts({ currentId, currentCategories = [] }) {
  const { data: all = [] } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  const catIds = new Set((currentCategories || []).map((c) => String(c.id)));
  const related = all.filter(
    (p) => p.id !== currentId && p.categories?.some?.((c) => catIds.has(String(c.id)))
  );

  const list = related.length ? related : all.filter((p) => p.id !== currentId);
  if (!list.length) return null;

  return (
    <section className="mt-12">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">You may also like</h2>
          <p className="text-sm text-gray-500">Similar products curated for you</p>
        </div>
        <Link to="/shop" className="text-blue-600 text-sm font-medium hover:underline">
          Browse all
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {list.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}



// import React, { useState, useMemo, useEffect, startTransition } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import {
//   useSuspenseQuery,
//   useQuery,
//   useMutation,
//   useQueryClient,
// } from "@tanstack/react-query";
// import {
//   addToCart,
//   getProductById,
//   getWishlist,
//   addToWishlist,
//   removeFromWishlist,
//   getAllProducts,
//   getCoupons,
// } from "../services/apiServices";
// import Api from "../constants/Api";
// import { addToGuestCart } from "../utils/cartStorage";
// import ProductCard from "../components/ProductCard";
// import Loader from "../components/Loader";
// import { CarTaxiFront, Heart, HeartCrack, ShoppingCart } from "lucide-react";

// export default function ProductDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();
//   const token = localStorage.getItem("token");

//   /* ----------------------------- Product detail ---------------------------- */
//   const { data: product, isPending: isLoading } = useSuspenseQuery({
//     queryKey: ["product", id],
//     queryFn: () => getProductById(id),
//   });

//   /* ---------------------------- Non-suspense queries ---------------------------- */
//   const { data: wishlist = [] } = useQuery({
//     queryKey: ["wishlist"],
//     queryFn: token ? getWishlist : () => { return [] },
//   });

//   const { data: coupons = [] } = useQuery({
//     queryKey: ["coupons"],
//     queryFn: getCoupons,
//   });

//   const [mainImage, setMainImage] = useState(null);
//   const [adding, setAdding] = useState(false);

//   /* ----------------------------- Wishlist logic ----------------------------- */
//   const item = wishlist.find((w) => w.productId === product?.id);

//   const addWishlistMutation = useMutation({
//     mutationFn: async () => addToWishlist({ productId: product.id }),
//     onSuccess: () => queryClient.invalidateQueries(["wishlist"]),
//     onError: (err) => alert(err?.message || "Failed to add to wishlist"),
//   });

//   const removeWishlistMutation = useMutation({
//     mutationFn: async (item) => {
//       if (!item?.id) throw new Error("Item not found in wishlist");
//       return removeFromWishlist(item.id);
//     },
//     onSuccess: () => queryClient.invalidateQueries(["wishlist"]),
//     onError: (err) => alert(err?.message || "Failed to remove from wishlist"),
//   });

//   /* ------------------------------- Add to cart ------------------------------ */
//   const handleAddToCart = async () => {
//     setAdding(true);
//     try {
//       startTransition(async () => {
//         if (token) {
//           await addToCart({ productId: product.id, quantity: 1 });
//         } else {
//           addToGuestCart(
//             {
//               id: product.id,
//               name: product.name,
//               price: product.price,
//               description: product.description,
//               files: product.files,
//             },
//             1
//           );
//         }
//         setTimeout(() => setAdding(false), 500);
//       });
//     } catch (error) {
//       console.error("Add to cart error:", error);
//       alert("❌ Failed to add item to cart.");
//       setTimeout(() => setAdding(false), 500);
//     }
//   };

//   useEffect(() => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, [id]);

//   if (isLoading) return <Loader />;
//   if (!product)
//     return <p className="text-center py-10 text-gray-600">Product not found.</p>;

//   const imageList =
//     product?.files?.map((f) => `${Api.BACKEND_URL}${f.path.replace(/\\/g, "/")}`) ||
//     [];
//   const displayImage =
//     mainImage || imageList[0] || product.imageUrl || "https://via.placeholder.com/600x400";

//   const inr = (n) =>
//     new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
//       Number(n || 0)
//     );

//   return (
//     <section className="bg-[#f9fafb] py-8 md:py-12">
//       <div className="max-w-7xl mx-auto px-4 md:px-8">
//         {/* 🧭 Breadcrumb */}
//         <nav className="text-sm text-gray-500 mb-5">
//           <div className="flex items-center gap-1">
//             <Link to="/" className="hover:text-blue-600">Home</Link> /
//             <Link to="/shop" className="hover:text-blue-600 ml-1">Shop</Link> /
//             <span className="text-gray-800 font-medium ml-1 line-clamp-1">{product.name}</span>
//           </div>
//         </nav>

//         {/* Main layout */}
//         <div className="grid lg:grid-cols-2 gap-10">
//           {/* 🖼 Image gallery */}
//           <div>
//             <div className="bg-white rounded-lg shadow-sm p-4 relative">
//               {product.stock <= 0 && (
//                 <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
//                   Out of Stock
//                 </span>
//               )}
//               <img
//                 src={displayImage}
//                 alt={product.name}
//                 className="w-full h-[420px] object-contain transition-transform duration-300 hover:scale-105"
//               />
//             </div>

//             {imageList.length > 1 && (
//               <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
//                 {imageList.map((img, idx) => (
//                   <button
//                     key={idx}
//                     onClick={() => setMainImage(img)}
//                     className={`w-20 h-20 rounded-md border-2 ${mainImage === img ? "border-blue-600" : "border-gray-200"
//                       } hover:border-blue-400 transition-all`}
//                   >
//                     <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* 📄 Info */}
//           <div className="space-y-4">
//             <h1 className="text-2xl font-bold text-gray-900 leading-snug">
//               {product.name}
//             </h1>

//             {/* ⭐ Rating */}
//             <div className="flex items-center gap-2">
//               <div className="bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
//                 <span>{product.rating?.toFixed(1) || "4.3"}</span>
//                 <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24..." />
//                 </svg>
//               </div>
//               <span className="text-sm text-gray-500">
//                 {product.reviews || 14215} Ratings & Reviews
//               </span>
//             </div>

//             {/* 💰 Price */}
//             <div className="flex items-end gap-3">
//               <p className="text-3xl font-bold text-gray-900">{inr(product.price)}</p>
//               {product.mrp && (
//                 <>
//                   <p className="line-through text-gray-400 text-lg">{inr(product.mrp)}</p>
//                   <span className="text-green-600 text-sm font-semibold">
//                     {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
//                   </span>
//                 </>
//               )}
//             </div>

//             {/* 🎟 Coupons */}
//             {coupons.length > 0 && (
//               <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
//                 <h4 className="font-semibold text-blue-800 mb-2">Available Coupons</h4>
//                 <div className="flex flex-wrap gap-2">
//                   {coupons.map((c) => (
//                     <div
//                       key={c.id}
//                       className="bg-white border border-dashed border-blue-300 text-blue-700 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-50 transition"
//                     >
//                       {c.code} — {c.discount}% OFF
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* ❤️ + 🛒 Buttons */}
//             <div className="flex flex-wrap gap-3 mt-4">
//               {/* ❤️ Add / Remove Wishlist */}
//               {!item ? (
//                 <button
//                   onClick={() => {
//                     if (!token) {
//                       navigate("/login");
//                       return;
//                     }
//                     addWishlistMutation.mutate()
//                   }}
//                   disabled={addWishlistMutation.isPending}
//                   className="flex-1 py-3 font-semibold rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition disabled:opacity-60"
//                 >
//                   {addWishlistMutation.isPending ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <svg
//                         className="animate-spin h-5 w-5 text-gray-600"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8v8z"
//                         ></path>
//                       </svg>
//                       Adding...
//                     </div>
//                   ) : (
//                     <div className="flex items-center justify-center gap-2">
//                       <Heart />  Add to Wishlist</div>
//                   )}
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => removeWishlistMutation.mutate(item)}
//                   disabled={removeWishlistMutation.isPending}
//                   className="flex-1 py-3 font-semibold rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
//                 >
//                   {removeWishlistMutation.isPending ? (
//                     <div className="flex items-center justify-center gap-2">
//                       <svg
//                         className="animate-spin h-5 w-5 text-red-500"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8v8z"
//                         ></path>
//                       </svg>
//                       Removing...
//                     </div>
//                   ) : (

//                     <div className="flex items-center justify-center gap-2">
//                       <HeartCrack />  Remove from Wishlist</div>
//                   )}
//                 </button>
//               )}

//               {/* 🛒 Add to Cart */}
//               <button
//                 onClick={handleAddToCart}
//                 disabled={adding}
//                 className={`flex-1 font-semibold text-white py-3 rounded-md transition ${adding
//                   ? "bg-blue-400 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700"
//                   }`}
//               >
//                 {adding ? (
//                   <div className="flex items-center justify-center gap-2">
//                     <svg
//                       className="animate-spin h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8v8z"
//                       ></path>
//                     </svg>
//                     Adding...
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-center gap-2">
//                     <ShoppingCart />  Add to Cart</div>
//                 )}
//               </button>
//             </div>

//             {/* 📝 Description */}
//             <div className="mt-6 border-t pt-4">
//               <h3 className="text-lg font-semibold mb-2">Product Description</h3>
//               <div className="text-gray-700 space-y-2 leading-relaxed">
//                 {product.description
//                   ? <p>{product.description.substring(0, 500)}...</p>
//                   : <p>No description available.</p>}
//               </div>

//             </div>
//           </div>
//         </div>
// <div className="mt-6 border-t pt-4">
//               <h3 className="text-lg font-semibold mb-2">Product Description</h3>
//              <div className="text-gray-700 space-y-2 leading-relaxed">
//                 {product.description
//                   ? product.description.split("\n").map((l, i) => <p key={i}>{l}</p>)
//                   : <p>No description available.</p>}
//               </div>

//             </div>

 
//         <RelatedProducts currentId={product.id} currentCategories={product.categories} />
//       </div>
//     </section>
//   );
// }

// /* ======================= Related Products ======================= */
// function RelatedProducts({ currentId, currentCategories = [] }) {
//   const { data: all = [] } = useSuspenseQuery({
//     queryKey: ["products"],
//     queryFn: getAllProducts,
//   });

//   const catIds = new Set((currentCategories || []).map((c) => String(c.id)));
//   const related = all.filter(
//     (p) => p.id !== currentId && p.categories?.some?.((c) => catIds.has(String(c.id)))
//   );

//   const list = related.length ? related : all.filter((p) => p.id !== currentId);
//   if (!list.length) return null;

//   return (
//     <section className="mt-12">
//       <div className="flex justify-between items-end mb-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">You may also like</h2>
//           <p className="text-sm text-gray-500">Similar products curated for you</p>
//         </div>
//         <Link to="/shop" className="text-blue-600 text-sm font-medium hover:underline">
//           Browse all
//         </Link>
//       </div>

//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
//         {list.slice(0, 8).map((p) => (
//           <ProductCard key={p.id} product={p} />
//         ))}
//       </div>
//     </section>
//   );
// }
