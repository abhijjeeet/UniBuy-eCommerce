import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProducts } from "../services/apiServices";
import Loader from "../components/Loader";
import {
  ChevronRight,
  Funnel,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";
import Api from "../constants/Api";

/* --------------------------------- Utils --------------------------------- */
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const toNumber = (n, fallback = 0) => (Number.isFinite(+n) ? +n : fallback);
const formatInt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ------------------------------- Page: Shop ------------------------------- */
export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: products = [], isPending: isLoading } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  if (isLoading) return <Loader />;
  if (!products.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">No products found</h2>
        <p className="mt-2 text-gray-600">Please check back later.</p>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const prices = products
    .map((p) => toNumber(p?.price, NaN))
    .filter((n) => Number.isFinite(n));
  const minPrice = Math.max(0, Math.min(...prices));
  const maxPrice = Math.max(...prices);

  const qParam = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? "pop";
  const loParam = toNumber(searchParams.get("min") ?? minPrice, minPrice);
  const hiParam = toNumber(searchParams.get("max") ?? maxPrice, maxPrice);
  const pageParam = Math.max(1, toNumber(searchParams.get("page") ?? 1, 1));

  const [query, setQuery] = useState(qParam);
  const debouncedQuery = useDebounced(query, 300);
  const [range, setRange] = useState([loParam, hiParam]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setQuery(qParam), [qParam]);
  useEffect(() => setRange([loParam, hiParam]), [loParam, hiParam]);

  const onApplyFilters = (next = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next.q !== undefined) nextParams.set("q", next.q);
    if (next.sort !== undefined) nextParams.set("sort", next.sort);
    if (next.min !== undefined) nextParams.set("min", String(next.min));
    if (next.max !== undefined) nextParams.set("max", String(next.max));
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  };

  const onClearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    next.delete("sort");
    next.delete("min");
    next.delete("max");
    next.set("page", "1");
    setSearchParams(next, { replace: true });
    setQuery("");
    setRange([minPrice, maxPrice]);
  };

  const filtered = useMemo(() => {
    const [lo, hi] = range;
    const text = (debouncedQuery || "").trim().toLowerCase();

    let arr = products.filter((p) => {
      const priceOk =
        toNumber(p?.price, Number.POSITIVE_INFINITY) >= lo &&
        toNumber(p?.price, Number.NEGATIVE_INFINITY) <= hi;

      if (!text) return priceOk;

      const textOk =
        p?.name?.toLowerCase?.().includes(text) ||
        p?.description?.toLowerCase?.().includes(text) ||
        p?.categories?.some?.((c) => c?.name?.toLowerCase?.().includes(text));

      return priceOk && textOk;
    });

    switch (sortParam) {
      case "priceAsc":
        arr.sort((a, b) => toNumber(a.price) - toNumber(b.price));
        break;
      case "priceDesc":
        arr.sort((a, b) => toNumber(b.price) - toNumber(a.price));
        break;
      case "rating":
        arr.sort(
          (a, b) =>
            toNumber(b.rating, 0) - toNumber(a.rating, 0) ||
            toNumber(b.reviews, 0) - toNumber(a.reviews, 0)
        );
        break;
      case "new":
        arr.sort(
          (a, b) =>
            toNumber(b.createdAt || b.id, 0) - toNumber(a.createdAt || a.id, 0)
        );
        break;
      default:
        arr.sort(
          (a, b) =>
            toNumber(b.reviews, 0) - toNumber(a.reviews, 0) ||
            toNumber(b.rating, 0) - toNumber(a.rating, 0)
        );
    }
    return arr;
  }, [products, range, debouncedQuery, sortParam]);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = clamp(pageParam, 1, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(clamp(p, 1, totalPages)));
    setSearchParams(next, { replace: true });
    const el = document.getElementById("grid-top");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="bg-gray-50 min-h-screen">
      <nav className="border-b border-gray-200 bg-white">
        <div className=" flex mx-5 items-center gap-2 px-6 py-3 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">Shop</span>
        </div>
      </nav>

      <header className=" mx-5 px-6 pt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              All Products
            </h1>
            <p className="mt-1 text-gray-600">
              {formatInt.format(filtered.length)} items • ₹
              {formatInt.format(minPrice)} – ₹{formatInt.format(maxPrice)}
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div className="relative">
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={sortParam}
                onChange={(e) => onApplyFilters({ sort: e.target.value })}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value="pop">Sort: Popular</option>
                <option value="rating">Sort: Rating</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
                <option value="new">Newest</option>
              </select>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 md:hidden"
            >
              <Funnel size={16} />
              Filters
            </button>
          </div>
        </div>
      </header>

      <section className=" mt-4 mx-5 gap-6 px-6 md:grid md:grid-cols-[260px_1fr] md:items-start">
        <aside className="hidden md:block">
          <FilterCard
            min={minPrice}
            max={maxPrice}
            value={range}
            onChange={setRange}
            onApply={() =>
              onApplyFilters({ min: range[0], max: range[1], q: query })
            }
            onClear={onClearFilters}
          />
        </aside>

        {/* Product List - Flipkart Style */}
        <div>
          <div id="grid-top" />
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-600">
              Nothing matches your filters. Try clearing filters to see more items.
              <div className="mt-4">
                <button
                  onClick={onClearFilters}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
              {pageItems.map((p) => {
                const hasMrp = p?.mrp && p.mrp > p.price;
                const off = hasMrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                console.log("============Api.BACKEND_URL + p.file?.[0]?.path",Api.BACKEND_URL + p.files?.[0]?.path)
                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="flex flex-col sm:flex-row items-start gap-5 p-5 hover:bg-gray-50 transition"
                  >
                    <div className="w-full sm:w-[220px] h-[200px] flex-shrink-0 bg-white border rounded-lg grid place-items-center">
                      <img
                        src={p.file?.[0]?.path ? Api.BACKEND_URL + p.file?.[0]?.path: "https://via.placeholder.com/200"}
                        alt={p.name}
                        className="max-h-[180px] object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 hover:text-indigo-600">
                        {p.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">
                          {p.rating?.toFixed(1) || "4.2"}★
                        </span>
                        <span className="text-xs text-gray-500">
                          {p.reviews || "120"} Ratings & Reviews
                        </span>
                      </div>
                      <ul className="mt-2 text-sm text-gray-600 space-y-0.5">
                        {p.description?.split(".").slice(0, 3).map((line, idx) => (
                          <li key={idx} className="truncate">• {line.trim()}</li>
                        ))}
                      </ul>
                      {off > 0 && (
                        <p className="mt-1 text-xs text-green-700 font-medium">
                          Upto ₹220 Off on Exchange
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:w-[180px] mt-3 sm:mt-0">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{Math.round(p.price).toLocaleString()}
                      </div>
                      {hasMrp && (
                        <div className="text-sm text-gray-500 line-through">
                          ₹{Math.round(p.mrp).toLocaleString()}
                        </div>
                      )}
                      {off > 0 && (
                        <div className="text-sm text-green-600 font-semibold">
                          {off}% off
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-end gap-1 text-[#388e3c] text-xs font-semibold">
                        <span className="w-2 h-2 bg-[#388e3c] rounded-full" />
                        Assured
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination current={currentPage} total={totalPages} onPage={goToPage} />
          )}
        </div>
      </section>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <FilterCard
          min={minPrice}
          max={maxPrice}
          value={range}
          onChange={setRange}
          onApply={() => {
            onApplyFilters({ min: range[0], max: range[1], q: query });
            setDrawerOpen(false);
          }}
          onClear={onClearFilters}
          dense
        />
      </MobileDrawer>
    </div>
  );
}

/* ------------------------------ FilterCard ------------------------------ */
function FilterCard({ min, max, value, onChange, onApply, onClear, dense = false }) {
  const [lo, hi] = value;
  const onLo = (v) => onChange([Math.min(toNumber(v, min), hi), hi]);
  const onHi = (v) => onChange([lo, Math.max(toNumber(v, max), lo)]);
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${dense ? "" : "sticky top-4"}`}>
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="text-indigo-600" size={18} />
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Price</p>
          <div className="flex items-center gap-2">
            <input type="number" min={min} max={hi} value={lo}
              onChange={(e) => onLo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100" />
            <span className="text-gray-400">—</span>
            <input type="number" min={lo} max={max} value={hi}
              onChange={(e) => onHi(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100" />
          </div>
          <div className="mt-3 space-y-2">
            <input type="range" min={min} max={max} step="1" value={lo}
              onChange={(e) => onLo(e.target.value)} className="w-full accent-indigo-600" />
            <input type="range" min={min} max={max} step="1" value={hi}
              onChange={(e) => onHi(e.target.value)} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹{formatInt.format(min)}</span>
              <span>₹{formatInt.format(max)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button onClick={onClear} className="text-sm font-medium text-gray-600 hover:text-gray-900">Clear all</button>
          <button onClick={onApply} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Mobile Drawer ----------------------------- */
function MobileDrawer({ open, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickAway);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickAway);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <section ref={ref} className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}

/* ------------------------------- Pagination ------------------------------- */
function Pagination({ current, total, onPage }) {
  const pages = useMemo(() => {
    const arr = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    if (!arr.includes(1)) arr.unshift(1);
    if (!arr.includes(total)) arr.push(total);
    return Array.from(new Set(arr)).sort((a, b) => a - b);
  }, [current, total]);
  return (
    <nav className="mt-8 mb-10 flex items-center justify-center gap-1">
      <button onClick={() => onPage(current - 1)} disabled={current <= 1}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-40">
        Prev
      </button>
      {pages.map((p, idx) => {
        const isEllipsis = idx > 0 && p - pages[idx - 1] > 1;
        return (
          <React.Fragment key={p}>
            {isEllipsis && <span className="px-2 text-gray-400">…</span>}
            <button onClick={() => onPage(p)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${p === current
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                }`}>
              {p}
            </button>
          </React.Fragment>
        );
      })}
      <button onClick={() => onPage(current + 1)} disabled={current >= total}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-40">
        Next
      </button>
    </nav>
  );
}
