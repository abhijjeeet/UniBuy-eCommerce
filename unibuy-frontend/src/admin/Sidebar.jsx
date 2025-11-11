import React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * Props:
 *  - open: boolean (controls mobile drawer visibility)
 *  - onClose: () => void (close handler for mobile)
 */
export default function Sidebar({ open = false, onClose = () => {} }) {
  const { pathname } = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Products", path: "/admin/products" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Tags", path: "/admin/tags" },
    { name: "Coupons", path: "/admin/coupons" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Setting", path: "/admin/setting" },
  ];

  const baseItem =
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
  const activeItem =
    "bg-slate-800 text-white";
  const idleItem =
    "text-slate-300 hover:bg-slate-800/70 hover:text-white";

  return (
    <>
      {/* Sidebar rail (off-canvas on mobile, static on lg+) */}
      <aside
        className={[
          // positioning
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300",
          // mobile slide state
          open ? "translate-x-0" : "-translate-x-full",
          // desktop pinned
          "lg:static lg:translate-x-0 lg:w-64",
          // theming
          "bg-slate-900 text-slate-100 border-r border-slate-800",
          // layout
          "flex flex-col"
        ].join(" ")}
        aria-label="Admin sidebar"
      >
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between lg:hidden px-4 py-3 border-b border-slate-800">
          <h2 className="text-lg font-semibold">UniBuy Admin</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M18.3 5.71L12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.29 1.41 1.42 6.3-6.3 6.29 6.3 1.42-1.42-6.3-6.29 6.3-6.3-1.41-1.41z"
              />
            </svg>
          </button>
        </div>

        {/* Brand (desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <h2 className="text-xl font-semibold">UniBuy Admin</h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose} // close drawer on mobile tap
                className={`${baseItem} ${active ? activeItem : idleItem}`}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / version (optional) */}
        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
          v1.0 • Admin
        </div>
      </aside>
    </>
  );
}
