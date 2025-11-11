import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { addToCart, loginUser, registerUser, sendOtp, verifyOtp } from "../services/apiServices";
import { clearGuestCart, getGuestCart } from "../utils/cartStorage";
import { useNavigate } from "react-router-dom";

export default function Register() {

  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

        // Decide where to land after login
        const redirectTo = location.state?.from || "/";

        // Option A (one-liner hard redirect + reload):

        // Option B (keep your navigate, then reload):
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

  // 🔹 Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: sendOtp,
    onSuccess: () => {
      setOtpSent(true);
      setSuccessMsg("📩 OTP sent successfully to your email!");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Failed to send OTP.");
    },
  });

  // 🔹 Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (res) => {
      setOtpVerified(true);
      setSuccessMsg(res.message || "✅ Email verified successfully!");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP.");
    },
  });

  // 🔹 Register User
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (res) => {
      setSuccessMsg(res.message || "🎉 Registration successful!");
      setErrorMsg("");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!otpVerified) return setErrorMsg("Please verify your email first.");
    if (form.password !== form.confirmPassword)
      return setErrorMsg("Passwords do not match.");

    await registerMutation.mutateAsync({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    await mutateAsync({ email: form.email, password: form.password });

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-2">
          Create Your UniBuy Account
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Join the student marketplace today 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Fields */}
          {["name", "email", "password", "confirmPassword"].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {key === "confirmPassword"
                  ? "Confirm Password"
                  : key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type={key === "password" || key === "confirmPassword" ? "password" : "text"}
                name={key}
                value={form[key]}
                onChange={handleChange}
                placeholder={
                  key === "name"
                    ? "John Doe"
                    : key === "email"
                      ? "you@studentmail.com"
                      : "••••••••"
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
          ))}

          {/* OTP Section */}
          {form.email && !otpVerified && (
            <div className="mt-3 space-y-3">
              {!otpSent ? (
                <button
                  type="button"
                  disabled={sendOtpMutation.isPending}
                  onClick={() => sendOtpMutation.mutate({ email: form.email })}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-70"
                >
                  {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifyOtpMutation.isPending}
                    onClick={() => {
                      verifyOtpMutation.mutate({ email: form.email, otp });
                      document.getElementById("submitform")?.click();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-all disabled:opacity-70"
                  >
                    {verifyOtpMutation.isPending
                      ? "Verifying..."
                      : "Verify OTP"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-green-600 text-sm text-center">{successMsg}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="submitform"
            disabled={!otpVerified || registerMutation.isPending}
            className={`w-full py-2.5 rounded-lg font-semibold transition-all ${otpVerified
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-300 cursor-not-allowed text-gray-500"
              }`}
          >
            {registerMutation.isPending
              ? "Registering..."
              : otpVerified
                ? "Create Account"
                : "Verify Email First"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Login
          </a>
        </p>

        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} UniBuy — Empowering Students
        </p>
      </div>
    </div>
  );
}
