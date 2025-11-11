import React from "react";
import { useNavigate } from "react-router-dom";
import Api from "../constants/Api";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { addToWishlist, getWishlist, removeFromWishlist } from "../services/apiServices";

const AssuranceBadge = () => (
  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#388e3c] bg-[#e9f7ec] px-2 py-0.5 rounded-full">
    <span className="w-1.5 h-1.5 bg-[#388e3c] rounded-full" />
    Assured
  </span>
);

export default function ProductCardFlip({ product }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");




  const { data: userwishlist = [], refetch } = useSuspenseQuery({
    queryKey: ["wishlist"],
    queryFn: token ? getWishlist : () => { return [] },
  });

  const { mutateAsync: onWishlist, } = useMutation({
    mutationFn: (productId) => addToWishlist({ productId }),
    onSuccess: refetch,
  });


  const { mutateAsync, isPending } = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: refetch,
  });
  const isInWishlist = userwishlist.find((item) => item.product?.id === product.id);

  console.log("=======", isInWishlist)
  const img =
    product?.files?.[0]?.path
      ? `${Api.BACKEND_URL}${product.files[0].path.replace(/\\/g, "/")}`
      : product?.imageUrl || "https://via.placeholder.com/300";

  const go = () => navigate(`/product/${product.id}`);

  const wishlist = async (e, isInWishlist) => {
    e.stopPropagation();
    if (!token) return navigate("/login");
    if (!isInWishlist) {

      await onWishlist(product.id);
    }
    else {
      await mutateAsync(isInWishlist.id);
    };
  }

  const hasMrp = product?.mrp && product?.mrp > product?.price;
  const off = hasMrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div
      onClick={go}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && go()}
      className="cursor-pointer bg-white rounded-md border border-gray-200 hover:shadow-md transition p-3 flex flex-col"
    >
      <div className="w-full h-48 bg-white rounded overflow-hidden grid place-items-center">
        <img
          src={img}
          alt={product?.name}
          className="max-h-44 object-contain"
          onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300")}
          loading="lazy"
        />
      </div>

      <div className="mt-3">
        <p className="text-gray-800 text-sm font-medium line-clamp-2">
          {product?.name}
          <AssuranceBadge />
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">₹{Math.round(product?.price || 0)}</span>
          {hasMrp && (
            <>
              <span className="text-xs line-through text-gray-400">₹{Math.round(product.mrp)}</span>
              <span className="text-xs font-semibold text-green-600">{off}% off</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-gray-500">Free delivery on orders over ₹2000</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={(e) => wishlist(e, isInWishlist)}
          className={`rounded-full px-3 ms-auto py-1 text-lg font-medium border border-gray-300 hover:border-red-400 hover:text-red-600 transition ${isInWishlist ? "bg-red-100 text-red-600 border-red-400" : "bg-white text-gray-700"}`}
          aria-label="Add to wishlist"
        >
          ♥ 
        </button>


      </div>
    </div>
  );
}
