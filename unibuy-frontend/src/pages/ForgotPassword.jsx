import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp, resetPassword } from "../services/apiServices";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1); // 1=Send OTP, 2=Verify OTP, 3=Reset Password
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 🔹 Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: sendOtp,
    onSuccess: () => {
      setStep(2);
      setSuccessMsg("📩 OTP sent successfully! Please check your email.");
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Failed to send OTP.");
    },
  });

  // 🔹 Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: () => {
      setStep(3);
      setSuccessMsg("✅ OTP verified! You can now reset your password.");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP.");
    },
  });

  // 🔹 Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (res) => {
      setSuccessMsg(res.message || "🎉 Password reset successfully!");
      setErrorMsg("");
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Failed to reset password.");
    },
  });

  // 🔹 Handlers
  const handleSendOtp = () => {
    if (!email) return setErrorMsg("Please enter your registered email.");
    sendOtpMutation.mutate({ email });
  };

  const handleVerifyOtp = () => {
    if (!otp) return setErrorMsg("Please enter the OTP.");
    verifyOtpMutation.mutate({ email, otp });
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword)
      return setErrorMsg("Please fill out both fields.");
    if (newPassword !== confirmPassword)
      return setErrorMsg("Passwords do not match.");

    resetPasswordMutation.mutate({ email, newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-2">
          Forgot Password
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Don’t worry — we’ll help you recover your account.
        </p>

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              Registered Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studentmail.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
            >
              {sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              Enter OTP sent to {email}
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
            </button>

            <p className="text-sm text-center text-gray-500">
              Didn’t get the code?{" "}
              <button
                onClick={handleSendOtp}
                className="text-blue-600 hover:underline"
              >
                Resend OTP
              </button>
            </p>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <label className="block text-sm font-medium text-gray-600">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            <button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
            >
              {resetPasswordMutation.isPending
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <p className="text-red-500 text-sm text-center mt-4">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-green-600 text-sm text-center mt-4">{successMsg}</p>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          Remembered your password?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Go back to Login
          </a>
        </p>

        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} UniBuy — Empowering Students
        </p>
      </div>
    </div>
  );
}
