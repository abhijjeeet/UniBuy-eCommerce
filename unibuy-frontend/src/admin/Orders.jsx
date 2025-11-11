import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getOrdersAdmin, updateOrderAdmin } from "../services/apiServices";
import Loader from "../components/Loader";
import Api from "../constants/Api";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Package,
  Truck,
  CheckCircle2,
  Ban,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  User,
  Tag,
  Percent,
  IndianRupee,
} from "lucide-react";

/* ----------------------------- utils & helpers ---------------------------- */
const inr = (n = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n || 0)
  );

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const productImage = (p) => {
  const raw = p?.files?.[0]?.path || p?.files?.[0]?.url;
  if (raw) return `${Api.BACKEND_URL}${raw}`;
  return p?.imageUrl || "https://via.placeholder.com/400x400?text=Product";
};

const STATUS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusStyles = {
  PENDING: {
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Package,
    label: "Pending",
  },
  PROCESSING: {
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    icon: Package,
    label: "Processing",
  },
  SHIPPED: {
    chip: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: Truck,
    label: "Shipped",
  },
  DELIVERED: {
    chip: "bg-green-50 text-green-700 ring-green-200",
    icon: CheckCircle2,
    label: "Delivered",
  },
  CANCELLED: {
    chip: "bg-rose-50 text-rose-700 ring-rose-200",
    icon: Ban,
    label: "Cancelled",
  },
};

/* --------------------------------- page ---------------------------------- */
export default function Orders() {
  const { data: orders = [], refetch, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getOrdersAdmin,
    suspense: false,
  });

  const { mutateAsync: updateStatus, isPending } = useMutation({
    mutationFn: updateOrderAdmin,
    onSuccess: refetch,
  });

  const [filter, setFilter] = useState("ALL");

  const filteredOrders = useMemo(
    () =>
      filter === "ALL"
        ? orders
        : orders.filter((o) => (o.status || "PENDING") === filter),
    [orders, filter]
  );

  if (isLoading) return <Loader />;

  return (
    <section className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              Orders
            </h1>
            <p className="text-gray-600">
              {orders.length} total • Filter:{" "}
              <span className="font-medium">{filter}</span>
            </p>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2">
            {["ALL", ...STATUS].map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                    active
                      ? "bg-gray-900 text-white ring-gray-900"
                      : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-600">No orders found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                onUpdate={(status) => updateStatus({ id: o.id, status })}
                updating={isPending}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------- order row ------------------------------- */
function OrderRow({ order, onUpdate, updating }) {
  const [open, setOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(true);
  const [showShipping, setShowShipping] = useState(false);

  const totalQty = (order.items || []).reduce(
    (n, it) => n + (it.quantity || 0),
    0
  );

  const sKey = (order.status || "PENDING").toUpperCase();
  const meta = statusStyles[sKey] || statusStyles.PENDING;
  const Icon = meta.icon;

  const user = order.user || {};
  const customerName =
    order.fullName || user.name || "Customer";
  const phone = order.phone || user.phone || "—";
  const email = user.email || "—";

  const address = [
    order.address,
    order.landmark,
    [order.city, order.state].filter(Boolean).join(", "),
    order.postalCode,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200 shadow-sm">
      {/* Summary row */}
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {open ? (
                <ChevronDown size={14} className="text-gray-500" />
              ) : (
                <ChevronRight size={14} className="text-gray-500" />
              )}
              Details
            </button>

            <span className="text-sm text-gray-500">Order</span>
            <span className="font-semibold text-gray-900">
              #{String(order.id).slice(0, 8)}
            </span>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.chip}`}
            >
              <Icon size={14} />
              {meta.label}
            </span>
          </div>

          <div className="mt-1 grid grid-cols-1 gap-y-1 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={16} className="text-gray-400" />
              {fmtDate(order.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <User size={16} className="text-gray-400" />
              {customerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail size={16} className="text-gray-400" />
              {email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Phone size={16} className="text-gray-400" />
              {phone}
            </span>
          </div>
        </div>

        {/* Right: total + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right pr-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {inr(order.finalAmount || order.totalPrice)}
            </p>
            <p className="text-xs text-gray-500">
              {totalQty} item{totalQty === 1 ? "" : "s"}
            </p>
          </div>

          {/* 🔽 Dropdown for status change */}
          <select
            value={sKey}
            onChange={(e) => onUpdate(e.target.value)}
            disabled={updating}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Invoice download */}
          <button
            type="button"
            onClick={() => alert("Invoice download coming soon")}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} />
            Invoice
          </button>
        </div>
      </div>

      {/* Details panel */}
      {open && (
        <div id={`order-${order.id}-panel`} className="p-5 space-y-5">
          {/* Order Financial Summary */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
            <h4 className="mb-2 font-semibold text-gray-900">Order Summary</h4>
            <p className="flex items-center gap-2">
              <Tag size={14} className="text-gray-500" /> Coupon:{" "}
              {order.couponCode || "—"}
            </p>
            <p className="flex items-center gap-2">
              <Percent size={14} className="text-gray-500" /> Discount:{" "}
              {inr(order.discount || 0)}
            </p>
            <p className="flex items-center gap-2">
              <IndianRupee size={14} className="text-gray-500" /> Final Amount:{" "}
              {inr(order.finalAmount || order.totalPrice)}
            </p>
          </div>

          {/* Products accordion */}
          <section className="rounded-2xl border border-gray-200 bg-white/70">
            <button
              onClick={() => setShowProducts((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-gray-900">
                Products
              </span>
              {showProducts ? (
                <ChevronDown size={18} className="text-gray-500" />
              ) : (
                <ChevronRight size={18} className="text-gray-500" />
              )}
            </button>

            {showProducts && (
              <div className="px-4 pb-4">
                <div className="max-h-72 overflow-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(order.items || []).map((it, idx) => {
                      const p = it.product || {};
                      const img = productImage(p);
                      return (
                        <div
                          key={`${order.id}-${p.id || idx}`}
                          className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3"
                        >
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <img
                              src={img}
                              alt={p.name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/200x200?text=Image";
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="line-clamp-2 font-semibold text-gray-900"
                              title={p.name}
                            >
                              {p.name || "Product"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Qty: <span className="font-medium">{it.quantity}</span>
                            </p>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {inr((p.price || 0) * (it.quantity || 1))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Shipping accordion */}
          <section className="rounded-2xl border border-gray-200 bg-white/70">
            <button
              onClick={() => setShowShipping((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-gray-900">
                Shipping & Contact
              </span>
              {showShipping ? (
                <ChevronDown size={18} className="text-gray-500" />
              ) : (
                <ChevronRight size={18} className="text-gray-500" />
              )}
            </button>

            {showShipping && (
              <div className="px-4 pb-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Contact
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <User size={16} className="mt-0.5 text-gray-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {customerName}
                          </p>
                          <p>{email}</p>
                          <p>{phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Shipping Address
                    </h4>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin size={16} className="mt-0.5 text-gray-400" />
                      <p className="min-w-0 break-words">{address || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  );
}
