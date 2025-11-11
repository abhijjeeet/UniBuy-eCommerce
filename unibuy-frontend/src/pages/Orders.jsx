import React, { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getOrders } from "../services/apiServices";
import { Link } from "react-router-dom";
import Api from "../constants/Api";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  ShoppingBag,
  X,
  Download,
} from "lucide-react";

/* ---------- Utilities ---------- */
const inr = (n = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n || 0));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "–";

const statusMap = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-100", icon: <Clock className="h-4 w-4" /> },
  processing: { label: "Processing", color: "text-indigo-600 bg-indigo-100", icon: <Package className="h-4 w-4" /> },
  shipped: { label: "Shipped", color: "text-blue-600 bg-blue-100", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-100", icon: <CheckCircle2 className="h-4 w-4" /> },
  default: { label: "Placed", color: "text-gray-600 bg-gray-100", icon: <ShoppingBag className="h-4 w-4" /> },
};

/* ---------- Component ---------- */
export default function Orders() {
  const { data: orders = [] } = useSuspenseQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!orders?.length) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">No Orders Yet</h1>
          <p className="mt-2 text-gray-600">Start shopping to see your orders here.</p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-semibold hover:bg-indigo-700 transition"
          >
            Browse Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </header>

        <div className="space-y-4">
          {orders.map((order) => {
            const s = (order?.status || "default").toLowerCase();
            const st = statusMap[s] || statusMap.default;
            const items = order?.items || [];
            const img = items[0]?.product?.files?.[0]?.path
              ? Api.BACKEND_URL + items[0].product.files[0].path
              : "https://via.placeholder.com/100?text=Product";

            return (
              <div
                key={order.id}
                className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* Left section: basic info */}
                <div className="flex items-center gap-4">
                  <img
                    src={img}
                    alt="Product"
                    className="h-16 w-16 rounded-lg object-cover border border-gray-100"
                  />
                  <div>
                    <p className="text-sm text-gray-500">Order #{String(order.id).slice(0, 8)}</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: <span className="font-semibold">{inr(order.totalPrice)}</span>
                    </p>
                  </div>
                </div>

                {/* Middle section: status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}
                  >
                    {st.icon} {st.label}
                  </span>
                </div>

                {/* Right section: action */}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Modal ---------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Order #{String(selectedOrder.id).slice(0, 8)}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Placed on {formatDate(selectedOrder.createdAt)}
            </p>

            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-900 mb-1">Delivery Address</h3>
                <p className="text-sm text-gray-700">
                  {selectedOrder.fullName}
                  <br />
                  {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} -{" "}
                  {selectedOrder.postalCode}
                  <br />
                  📞 {selectedOrder.phone}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                <ul className="divide-y divide-gray-100 text-sm">
                  {selectedOrder.items?.map((it) => {
                    const p = it.product || {};
                    const img =
                      p.files?.[0]?.path
                        ? Api.BACKEND_URL + p.files[0].path
                        : "https://via.placeholder.com/80?text=Product";

                    return (
                      <li key={it.id} className="py-2 flex gap-3 items-center border-b border-gray-100">
                        <img src={img} alt={p.name} className="w-12 h-12 rounded object-cover border" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{p.name || "Product unavailable"}</p>
                          <p className="text-sm text-gray-500">Qty: {it.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">{inr((p.price || 0) * it.quantity)}</span>
                      </li>
                    );
                  })}


                </ul>
              </div>

              <div className="border-t pt-3 text-right">
                <p className="text-sm text-gray-700">
                  Subtotal: <strong>{inr(selectedOrder.totalPrice)}</strong>
                </p>
                {selectedOrder.discount > 0 && (
                  <p className="text-sm text-green-600">
                    Discount: −{inr(selectedOrder.discount)}
                  </p>
                )}
                <p className="mt-1 text-base font-bold text-gray-900">
                  Total: {inr(selectedOrder.finalAmount || selectedOrder.totalPrice)}
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">Payment Method: Cash on Delivery</span>
                <button
                  className="inline-flex items-center gap-1 text-sm text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  onClick={() => alert("Invoice download coming soon")}
                >
                  <Download className="h-4 w-4" />
                  Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
