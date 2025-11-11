import React, { useEffect, useState } from "react";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/apiServices";
import {
  getGuestCart,
  saveGuestCart,
  removeFromGuestCart,
} from "../utils/cartStorage";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import Api from "../constants/Api";

export default function Cart() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [guestCart, setGuestCart] = useState([]);
  const [useGuestMode, setUseGuestMode] = useState(!token);

  // 🧩 Load guest cart if not logged in or fallback mode
  useEffect(() => {
    if (!token || useGuestMode) setGuestCart(getGuestCart());
  }, [token, useGuestMode]);

  // 🔹 Safe cart fetcher that catches 401 errors
  const safeGetCart = async () => {
    try {
      return await getCart();
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn("Token expired or invalid → switching to guest mode");
        localStorage.removeItem("token");
        setToken(null);
        setUseGuestMode(true);
        setGuestCart(getGuestCart());
        return []; // fallback
      }
      throw err; // rethrow other errors
    }
  };

  // 🔹 Fetch user cart only if logged in
  const {
    data: userCart = [],
    isLoading,
    refetch,
  } = useSuspenseQuery({
    queryKey: ["cart"],
    queryFn: safeGetCart,
    enabled: !!token && !useGuestMode,
  });

  // 🔹 Remove + Update (for logged-in users)
  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: refetch,
  });

  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: refetch,
  });

  // 🔹 Guest cart functions
  const handleGuestQuantity = (id, newQty) => {
    const updated = guestCart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(newQty, 1) } : item
    );
    setGuestCart(updated);
    saveGuestCart(updated);
  };

  const handleGuestRemove = (id) => {
    removeFromGuestCart(id);
    setGuestCart(getGuestCart());
  };

  // 🔹 Shared quantity handler
  const handleQuantityChange = async (item, newQty) => {
    if (token && !useGuestMode) {
      if (newQty <= 0) return handleRemove(item.id);
      await updateMutation.mutateAsync({ id: item.id, quantity: newQty });
    } else {
      handleGuestQuantity(item.id, newQty);
    }
  };

 // 🔹 Shared remove handler
// 🔹 Shared remove handler
const handleRemove = async (id) => {
  if (token && !useGuestMode) {
    if (window.confirm("Remove this item from cart?")) {
      await removeMutation.mutateAsync(id);

      // ✅ Reload after successful removal
      window.location.reload();
    }
  } else {
    handleGuestRemove(id);

    // ✅ Also reload for guest cart removal
    window.location.reload();
  }
};



  const cart = token && !useGuestMode ? userCart : guestCart;
  const isEmpty = !cart?.length;
  const subtotal = cart.reduce((sum, item) => {
    const unitPrice =
      item.variant?.price ??
      item.product?.price ??
      item.price ??
      0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

  if (token && !useGuestMode && isLoading) return <Loader />;

  if (isEmpty)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <img
          src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
          alt="Empty Cart"
          className="w-32 mb-4 opacity-70"
        />
        <p className="text-gray-600 text-lg">Your cart is empty.</p>
        <Link
          to="/"
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </Link>
      </div>
    );

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          Shopping Cart
        </h2>

        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          {/* 🛒 CART ITEMS */}
          <div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
            <div className="space-y-6">
              {cart.map((item) => {
                const product = token && !useGuestMode ? item.product : item;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6"
                  >
                    <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
                      {/* Image */}
                      <Link
                        to={`/product/${product.id}`}
                        className="shrink-0 md:order-1"
                      >
                        <img
                          className="h-20 w-20 rounded-md border object-cover"
                          src={
                            product?.files?.[0]
                              ? Api.BACKEND_URL +
                              product.files[0].path.replace(/\\/g, "/")
                              : "https://via.placeholder.com/100"
                          }
                          alt={product.name}
                        />
                      </Link>

                      {/* Quantity + Total */}
                      <div className="flex items-center justify-between md:order-3 md:justify-end">
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              handleQuantityChange(item, item.quantity - 1)
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200"
                          >
                            <svg
                              className="h-3 w-3 text-gray-900"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 18 2"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M1 1h16"
                              />
                            </svg>
                          </button>
                          <span className="mx-3 text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(item, item.quantity + 1)
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-gray-100 hover:bg-gray-200"
                          >
                            <svg
                              className="h-3 w-3 text-gray-900"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 18 18"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 1v16M1 9h16"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="text-end md:order-4 md:w-32">
                          <p className="text-base font-bold text-gray-900">
                            ₹
                            ₹{(
                              ((item.variant?.price ?? product.price ?? 0) * (item.quantity || 1))
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Info + Remove */}
                      <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
                        <Link
                          to={`/product/${product.id}`}
                          className="text-base font-medium text-gray-900 hover:underline"
                        >
                          {product.name}
                        </Link>
                        {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
                          <p className="text-sm text-gray-600">
                            {Object.entries(item.variantSelection)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" • ")}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {product.description?.slice(0, 100)}...
                        </p>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="inline-flex items-center text-sm font-medium text-red-600 hover:underline"
                          >
                            <svg
                              className="me-1.5 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 💰 ORDER SUMMARY */}
          <div className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full">
            <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xl font-semibold text-gray-900">Order Summary</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500">
                      Subtotal
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ₹{subtotal.toLocaleString()}
                    </dd>
                  </dl>

                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-500">
                      Shipping
                    </dt>
                    <dd className="text-base font-medium text-green-600">Free</dd>
                  </dl>
                </div>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2">
                  <dt className="text-base font-bold text-gray-900">Total</dt>
                  <dd className="text-base font-bold text-gray-900">
                    ₹{subtotal.toLocaleString()}
                  </dd>
                </dl>
              </div>

              <button
                onClick={() =>
                  navigate("/checkout")
                }
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {token && !useGuestMode ? "Proceed to Checkout" : "Checkout"}
              </button>

              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500">or</span>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 underline hover:no-underline"
                >
                  Continue Shopping
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 12H5m14 0-4 4m4-4-4-4"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
