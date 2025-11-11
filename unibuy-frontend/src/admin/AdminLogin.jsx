import React, { useState, useEffect, useContext } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { loginUser } from "../services/apiServices";
import { AuthContext } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // 🔁 Redirect if already logged in as admin
  useEffect(() => {
    if (auth?.role === "ADMIN" && auth?.token) {
      navigate("/admin", { replace: true });
    }
  }, [auth, navigate]);

  // ✅ Use mutation with context login
  const { mutateAsync: login, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (res) => {
      if (res?.token && res?.role === "ADMIN") {
        auth.login(res.token, "ADMIN");
        navigate("/admin");
      } else {
        setError("Unauthorized: Admin access only");
      }
    },
    onError: () => {
      setError("Invalid email or password");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    await login(form);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-100 relative px-4">
      {/* 🔙 Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Admin Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transition-all hover:shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1792/1792513.png"
            alt="Admin"
            className="w-16 mx-auto mb-3"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            Admin Login
          </h2>
          <p className="text-gray-500 text-sm">
            Secure access to your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-center text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-md transition disabled:opacity-70"
          >
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} UniBuy Admin Portal
        </p>
      </div>
    </div>
  );
}
