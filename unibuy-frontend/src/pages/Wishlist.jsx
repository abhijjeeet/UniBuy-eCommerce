import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { getWishlist, removeFromWishlist, addToWishlist } from "../services/apiServices";
import { Heart, ShoppingBag } from "lucide-react";
import Api from "../constants/Api";
import Loader from "../components/Loader";

export default function Wishlist() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const { data: wishlist = [], isPending: isLoading, refetch } = useSuspenseQuery({
    queryKey: ["wishlist"],
    queryFn: token ? getWishlist : () => [],
  });

  const { mutateAsync: removeItem, isPending: removing } = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: refetch,
  });

  const { mutateAsync: addItem } = useMutation({
    mutationFn: addToWishlist,
    onSuccess: refetch,
  });

  if (isLoading) return <Loader />;

  if (!wishlist?.length) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
            <Heart className="text-rose-500" size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Your wishlist is empty</h2>
          <p className="mt-2 text-gray-600">
            Save products you love and compare them later.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Start shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-10 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Wishlist</h1>
            <p className="text-gray-600">
              {wishlist.length} item{wishlist.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Continue shopping
          </Link>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {wishlist.map((w) => {
            const p = w.product ?? {};
            const img =
              p?.files?.[0]?.path
                ? `${Api.BACKEND_URL}${p.files[0].path.replace(/\\/g, "/")}`
                : p.imageUrl || "https://via.placeholder.com/300";
            const hasMrp = p?.mrp && p.mrp > p.price;
            const off = hasMrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

            return (
              <div
                key={w.id}
                className="relative bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all p-3 flex flex-col cursor-pointer"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                {/* Image */}
                <div className="w-full h-48 bg-white rounded overflow-hidden grid place-items-center">
                  <img
                    src={img}
                    alt={p?.name}
                    className="max-h-44 object-contain"
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300')}
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="mt-3 flex-1">
                  <p className="text-gray-800 text-sm font-medium line-clamp-2">
                    {p?.name}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{Math.round(p?.price || 0)}
                    </span>
                    {hasMrp && (
                      <>
                        <span className="text-xs line-through text-gray-400">₹{Math.round(p.mrp)}</span>
                        <span className="text-xs font-semibold text-green-600">{off}% off</span>
                      </>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-gray-500">
                    Free delivery on orders over ₹2000
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert("Add-to-cart coming soon!");
                    }}
                    className="rounded-full border border-gray-300 text-gray-700 px-3 py-1 text-sm font-medium hover:bg-gray-100 transition flex items-center gap-1"
                  >
                    <ShoppingBag size={14} />
                    Add to Cart
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(w.id);
                    }}
                    disabled={removing}
                    className={`rounded-full px-3 py-1 text-lg border transition ${
                      removing
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:border-red-400 hover:text-red-600"
                    } border-gray-300 text-gray-700`}
                    aria-label="Remove from wishlist"
                  >
                    <Heart
                      size={18}
                      className="text-rose-600"
                      fill="currentColor"
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
