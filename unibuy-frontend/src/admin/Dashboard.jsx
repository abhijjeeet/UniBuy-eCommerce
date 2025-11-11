import React, { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  getProductsAdmin,
  getOrdersAdmin,
  getCategoriesAdmin,
} from "../services/apiServices";
import Loader from "../components/Loader";
import {
  ArrowUpRight,
  Package,
  ShoppingBag,
  Layers,
  IndianRupee,
  CheckCircle2,
  Truck,
  Ban,
  PackageOpen,
} from "lucide-react";

/* ------------------------------- utils ------------------------------- */
const inr = (n = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n || 0)
  );

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

const lastNMonths = (n = 12) => {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: d.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  return out;
};

const safe = (v, fb = 0) => (Number.isFinite(+v) ? +v : fb);

/* ---------------------------- tiny charts ---------------------------- */
// Simple SVG sparkline
function Sparkline({ values = [], height = 48, strokeWidth = 2 }) {
  if (!values.length) return null;
  const w = Math.max(120, values.length * 24);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v) =>
    max === min ? height / 2 : height - ((v - min) / (max - min)) * height;
  const step = w / (values.length - 1 || 1);

  const points = values.map((v, i) => `${i * step},${norm(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-12">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        points={points}
        className="text-indigo-600"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Soft gradient under line */}
      <polyline
        points={`${points} ${w},${height} 0,${height}`}
        fill="url(#grad)"
        stroke="none"
      />
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopOpacity="0.18" stopColor="rgb(79 70 229)" />
          <stop offset="100%" stopOpacity="0" stopColor="rgb(79 70 229)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Simple horizontal bar chart
function HBar({ data = [], maxWidth = 100 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium text-gray-900">{d.value}</span>
          </div>
          <div className="h-2 w-full rounded bg-gray-100">
            <div
              className="h-2 rounded bg-indigo-600"
              style={{ width: `${(d.value / max) * maxWidth}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- main view ----------------------------- */
export default function Dashboard() {
  const { data: products = [], isLoading: loadingP } = useSuspenseQuery({
    queryKey: ["admin-products"],
    queryFn: getProductsAdmin,
  });
  const { data: orders = [], isLoading: loadingO } = useSuspenseQuery({
    queryKey: ["admin-orders"],
    queryFn: getOrdersAdmin,
  });
  const { data: categories = [], isLoading: loadingC } = useSuspenseQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategoriesAdmin,
  });

  if (loadingP || loadingO || loadingC) return <Loader />;

  /* ---------------------------- analytics ---------------------------- */
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + safe(o.totalPrice), 0),
    [orders]
  );

  const aov = useMemo(
    () => (orders.length ? totalRevenue / orders.length : 0),
    [orders, totalRevenue]
  );

  // Revenue by month (last 12 months)
  const months = lastNMonths(12);
  const revenueByMonth = useMemo(() => {
    const map = new Map();
    months.forEach((m) => map.set(m.key, 0));
    orders.forEach((o) => {
      const k = monthKey(o.createdAt || o.updatedAt || Date.now());
      if (map.has(k)) map.set(k, map.get(k) + safe(o.totalPrice));
    });
    return months.map((m) => ({ label: m.label, value: map.get(m.key) || 0 }));
  }, [orders]);

  // Order status counts
  const statusOrder = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  const statusCounts = useMemo(() => {
    const map = new Map(statusOrder.map((s) => [s, 0]));
    orders.forEach((o) => {
      const s = (o.status || "PENDING").toUpperCase();
      map.set(s, (map.get(s) || 0) + 1);
    });
    return statusOrder.map((s) => ({ label: s, value: map.get(s) || 0 }));
  }, [orders]);

  // Top categories by units sold (from order items)
  const topCategories = useMemo(() => {
    const catCounts = new Map(); // catId -> qty
    orders.forEach((o) =>
      (o.items || []).forEach((it) => {
        const p = it.product || {};
        const qty = safe(it.quantity, 0);
        (p.categories || []).forEach((c) => {
          catCounts.set(c.id, (catCounts.get(c.id) || 0) + qty);
        });
      })
    );
    const rows = categories
      .map((c) => ({ id: c.id, label: c.name, value: catCounts.get(c.id) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return rows;
  }, [orders, categories]);

  // Recent orders (latest 6)
  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt || 0) -
            new Date(a.createdAt || a.updatedAt || 0)
        )
        .slice(0, 6),
    [orders]
  );

  /* ------------------------------- UI ------------------------------- */
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            Overview
          </h2>
          <p className="text-gray-600">
            Quick snapshot of your store performance
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI
          label="Revenue"
          value={inr(totalRevenue)}
          icon={IndianRupee}
          accent="text-emerald-600 bg-emerald-50"
        />
        <KPI
          label="Orders"
          value={orders.length}
          icon={ShoppingBag}
          accent="text-indigo-600 bg-indigo-50"
        />
        <KPI
          label="Avg. Order Value"
          value={inr(aov)}
          icon={ArrowUpRight}
          accent="text-blue-600 bg-blue-50"
        />
        <KPI
          label="Products"
          value={products.length}
          icon={Package}
          accent="text-violet-600 bg-violet-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Revenue (12 mo)</h3>
              <p className="text-sm text-gray-500">
                {inr(revenueByMonth.reduce((s, r) => s + r.value, 0))} total
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Sparkline values={revenueByMonth.map((d) => d.value)} />
          </div>
          <div className="mt-3 grid grid-cols-12 text-[11px] text-gray-500">
            {revenueByMonth.map((d, i) => (
              <span key={i} className="text-center">
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Order status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Order Status</h3>
          <p className="text-sm text-gray-500">
            Distribution of all orders
          </p>
          <div className="mt-4">
            <HBar data={statusCounts} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Badge icon={PackageOpen} label="Pending" tone="bg-amber-50 text-amber-700" />
            <Badge icon={Package} label="Processing" tone="bg-indigo-50 text-indigo-700" />
            <Badge icon={Truck} label="Shipped" tone="bg-blue-50 text-blue-700" />
            <Badge icon={CheckCircle2} label="Delivered" tone="bg-green-50 text-green-700" />
            <Badge icon={Ban} label="Cancelled" tone="bg-rose-50 text-rose-700" />
          </div>
        </div>
      </div>

      {/* Top categories + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Top Categories</h3>
          <p className="text-sm text-gray-500">By units sold</p>
          <div className="mt-4">
            {topCategories.length ? (
              <HBar data={topCategories} />
            ) : (
              <p className="text-sm text-gray-500">No category sales yet.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Order</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Items</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const itemCount = (o.items || []).reduce(
                    (n, it) => n + (it.quantity || 0),
                    0
                  );
                  return (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        #{String(o.id).slice(0, 8)}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {new Date(o.createdAt || o.updatedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">{itemCount}</td>
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {inr(o.totalPrice)}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          {(o.status || "PENDING").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!recentOrders.length && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- small UI pieces --------------------------- */
function KPI({ label, value, icon: Icon, accent = "bg-gray-100 text-gray-700" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, tone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${tone} text-xs font-semibold`}>
      <Icon size={12} />
      {label}
    </span>
  );
}
