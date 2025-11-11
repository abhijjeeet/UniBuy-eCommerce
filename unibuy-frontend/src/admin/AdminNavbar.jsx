import React from "react";

export default function AdminNavbar({ setSidebarOpen }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-200">
      <nav className="mx-auto  px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Left: Mobile menu + Brand */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Open sidebar"
            >
              {/* Hamburger Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" className="block">
                <path
                  fill="currentColor"
                  d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"
                />
              </svg>
            </button>

            {/* Brand / Title */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              {/* Only show “Admin Dashboard” on large screens */}
              <h1 className="hidden lg:block text-lg font-semibold text-gray-800 tracking-tight">
                Admin Dashboard
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Quick status pill (optional) */}
           
            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-gray-200" />

            {/* Profile stub (replace with real avatar later) */}
            <button
              className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Account"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                U
              </span>
              <span className="hidden md:inline">Admin</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
            >
              {/* Logout Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
                <path
                  fill="currentColor"
                  d="M10 17v-2h4v-6h-4V7h6v10h-6Zm-6-5l3-3v2h4v2H7v2l-3-3Z"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
