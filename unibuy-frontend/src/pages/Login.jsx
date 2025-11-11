import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { loginUser, addToCart } from "../services/apiServices";
import { getGuestCart, clearGuestCart } from "../utils/cartStorage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 🧭 Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/", { replace: true });
  }, [navigate]);

  // 🛒 Merge guest cart after login
  const mergeGuestCart = async () => {
    const guestCart = getGuestCart();
    if (!guestCart.length) return;
    for (const item of guestCart) {
      await addToCart({ productId: item.id, quantity: item.quantity });
    }
    clearGuestCart();
  };

  // 🔹 Login mutation
  const { mutateAsync, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: async (res) => {
      if (res?.token) {
        localStorage.setItem("token", res.token);
        await mergeGuestCart();

        const redirectTo = location.state?.from || "/";
        navigate(redirectTo, { replace: true });
        setTimeout(() => window.location.reload(), 0);
      } else {
        setErrorMsg("Invalid login response.");
      }
    },
    onError: (err) => {
      setErrorMsg(err?.response?.data?.message || "Invalid credentials");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    await mutateAsync({ email, password });
  };

  // 🧭 Go back handler
  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 relative px-4">
      {/* 🔙 Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transition-all hover:shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://cdn-icons-png.flaticon.com/512/891/891462.png"
            alt="Logo"
            className="w-16 mx-auto mb-3 drop-shadow-sm"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Welcome Back 👋
          </h1>
          <p className="text-gray-500 text-sm">Sign in to continue shopping</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right -mt-2">
            <Link
              to="/forgotPassword"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200 disabled:opacity-70"
          >
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} UniBuy — Empowering Students
        </p>
      </div>
    </div>
  );
}
