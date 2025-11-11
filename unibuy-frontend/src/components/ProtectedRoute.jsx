import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // 🚫 Redirect to proper login page
        navigate(adminOnly ? "/admin/login" : "/login", { replace: true });
      } else if (adminOnly && role !== "ADMIN") {
        // 🚫 Redirect non-admin users away from admin routes
        navigate("/", { replace: true });
      }
    }
  }, [user, role, loading, adminOnly, navigate]);

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!user || (adminOnly && role !== "ADMIN")) {
    return null; // nothing rendered while redirecting
  }

  return children;
}
