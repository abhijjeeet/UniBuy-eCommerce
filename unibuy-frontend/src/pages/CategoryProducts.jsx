import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getAllProducts } from "../services/apiServices";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import {
  ChevronRight,
  Funnel,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Search,
} from "lucide-react";

/* --------------------------------- Utils --------------------------------- */

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const toNumber = (n, fallback = 0) => (Number.isFinite(+n) ? +n : fallback);
const formatInt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** gently debounced value for text inputs */
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ------------------------------- Page Shell ------------------------------- */

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data
  const { data: products = [], isPending: isLoading } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  // Guard: loader
  if (isLoading) return <Loader />;

  // Filter by route category id (loose equality to match your previous code)
  const inCategory = products.filter((p) =>
    p?.categories?.some?.((c) => c?.id == id)
  );

  // Early empty state
  if (!inCategory.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">No products found</h2>
        <p className="mt-2 text-gray-600">
          We couldn’t find items for this category yet.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Derive category name from first matching product
  const categoryName =
    inCategory[0]?.categories?.find?.((c) => c?.id == id)?.name || "Category";

  // Price bounds from category products
  const prices = inCategory
    .map((p) => toNumber(p?.price, NaN))
    .filter((n) => Number.isFinite(n));
  const minPrice = Math.max(0, Math.min(...prices));
  const maxPrice = Math.max(...prices);

  // URL state (for shareable filters)
  const qParam = searchParams.get("q") ?? "";
  const sortParam = searchParams.get("sort") ?? "pop";
  const loParam = toNumber(searchParams.get("min") ?? minPrice, minPrice);
  const hiParam = toNumber(searchParams.get("max") ?? maxPrice, maxPrice);
  const pageParam = Math.max(1, toNumber(searchParams.get("page") ?? 1, 1));

  // Local (controlled) inputs
  const [query, setQuery] = useState(qParam);
  const debouncedQuery = useDebounced(query, 300);
  const [range, setRange] = useState([loParam, hiParam]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep local <> URL in sync
  useEffect(() => setQuery(qParam), [qParam]);
  useEffect(() => setRange([loParam, hiParam]), [loParam, hiParam]);

  const onApplyFilters = (next = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next.q !== undefined) nextParams.set("q", next.q);
    if (next.sort !== undefined) nextParams.set("sort", next.sort);
    if (next.min !== undefined) nextParams.set("min", String(next.min));
    if (next.max !== undefined) nextParams.set("max", String(next.max));
    // reset page when filters change
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

  // Compute filtered + sorted
  const filtered = useMemo(() => {
    const [lo, hi] = range;
    const text = (debouncedQuery || "").trim().toLowerCase();

    let arr = inCategory.filter((p) => {
      const priceOk =
        toNumber(p?.price, Number.POSITIVE_INFINITY) >= lo &&
        toNumber(p?.price, Number.NEGATIVE_INFINITY) <= hi;
      const textOk =
        !text ||
        p?.name?.toLowerCase().includes(text) ||
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
        // fallback: uses id as recency if no createdAt
        arr.sort(
          (a, b) =>
            toNumber(b.createdAt || b.id, 0) - toNumber(a.createdAt || a.id, 0)
        );
        break;
      default: // "pop"
        arr.sort(
          (a, b) =>
            toNumber(b.reviews, 0) - toNumber(a.reviews, 0) ||
            toNumber(b.rating, 0) - toNumber(a.rating, 0)
        );
    }
    return arr;
  }, [inCategory, range, debouncedQuery, sortParam]);

  /* ----------------------------- Pagination ----------------------------- */
  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = clamp(pageParam, 1, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(clamp(p, 1, totalPages)));
    setSearchParams(next, { replace: true });
    // Scroll to grid top
    const el = document.getElementById("grid-top");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">{categoryName}</span>
        </div>
      </nav>

      {/* Header + Controls */}
      <header className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              {categoryName}
            </h1>
            <p className="mt-1 text-gray-600">
              {formatInt.format(filtered.length)} item
              {filtered.length === 1 ? "" : "s"} • Price ${formatInt.format(minPrice)} – $
              {formatInt.format(maxPrice)}
            </p>
          </div>

          {/* Top control row */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in this category…"
                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={sortParam}
                onChange={(e) =>
                  onApplyFilters({ sort: e.target.value })
                }
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              >
                <option value="pop">Sort: Popular</option>
                <option value="rating">Sort: Rating</option>
                <option value="priceAsc">Price: Low → High</option>
                <option value="priceDesc">Price: High → Low</option>
                <option value="new">Newest</option>
              </select>
            </div>

            {/* Mobile filter button */}
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

      {/* Desktop Filters */}
      <section className="mx-auto mt-4 max-w-7xl gap-6 px-6 md:grid md:grid-cols-[260px_1fr] md:items-start">
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

        {/* Product grid */}
        <div>
          <div id="grid-top" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              current={currentPage}
              total={totalPages}
              onPage={goToPage}
            />
          )}
        </div>
      </section>

      {/* Mobile Drawer */}
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

/* ------------------------------ Filter Card ------------------------------ */

function FilterCard({ min, max, value, onChange, onApply, onClear, dense = false }) {
  const [lo, hi] = value;
  const onLo = (v) => onChange([Math.min(toNumber(v, min), hi), hi]);
  const onHi = (v) => onChange([lo, Math.max(toNumber(v, max), lo)]);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${dense ? "" : "sticky top-4"
        }`}
      aria-label="Filters"
    >
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="text-indigo-600" size={18} />
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Price */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Price</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={min}
              max={hi}
              value={lo}
              onChange={(e) => onLo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              aria-label="Minimum price"
            />
            <span className="text-gray-400">—</span>
            <input
              type="number"
              min={lo}
              max={max}
              value={hi}
              onChange={(e) => onHi(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100"
              aria-label="Maximum price"
            />
          </div>

          {/* Simple dual sliders (stacked) */}
          <div className="mt-3 space-y-2">
            <input
              type="range"
              min={min}
              max={max}
              step="1"
              value={lo}
              onChange={(e) => onLo(e.target.value)}
              className="w-full accent-indigo-600"
              aria-label="Minimum price slider"
            />
            <input
              type="range"
              min={min}
              max={max}
              step="1"
              value={hi}
              onChange={(e) => onHi(e.target.value)}
              className="w-full accent-indigo-600"
              aria-label="Maximum price slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>${formatInt.format(min)}</span>
              <span>${formatInt.format(max)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Apply
          </button>
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
      <section
        ref={ref}
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl"
        aria-label="Mobile filters"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
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
    // simple windowed pagination
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    if (!arr.includes(1)) arr.unshift(1);
    if (!arr.includes(total)) arr.push(total);
    return Array.from(new Set(arr)).sort((a, b) => a - b);
  }, [current, total]);

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      role="navigation"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPage(current - 1)}
        disabled={current <= 1}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-40"
      >
        Prev
      </button>

      {pages.map((p, idx) => {
        const isEllipsis =
          idx > 0 && p - pages[idx - 1] > 1 && p !== current && pages[idx - 1] !== current;
        return (
          <React.Fragment key={p}>
            {isEllipsis && (
              <span className="px-2 text-gray-400" aria-hidden="true">
                …
              </span>
            )}
            <button
              onClick={() => onPage(p)}
              aria-current={p === current ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium ${p === current
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        onClick={() => onPage(current + 1)}
        disabled={current >= total}
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
