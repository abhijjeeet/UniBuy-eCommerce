import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../admin/AdminNavbar";
import Sidebar from "../admin/Sidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop rail / Mobile drawer */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile hamburger */}
       

        {/* Your existing top bar */}
        <div className="">
          <AdminNavbar  setSidebarOpen={setSidebarOpen}/>
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
