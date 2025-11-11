import React from "react";
import { CreditCard, Lock, Settings, ToggleLeft, ToggleRight } from "lucide-react";

export default function SettingPage() {

  const user = {
    name: "Admin",
    email: "admin@gmail.com",
    role: "ADMIN",
  };

  return (
    <section className="min-h-screen bg-gray-50 py-10 dark:bg-gray-900">
      <div className=" mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="text-indigo-600" size={26} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <button
            disabled
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-400 rounded-lg opacity-70 cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>

        {/* Profile Section */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 mb-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profile Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Full Name</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user.email}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Role</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {user.role}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Password</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                ********
                <Lock className="text-gray-400" size={14} />
              </p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 mb-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Options
            </h2>
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-gray-300 text-gray-600 text-sm font-medium cursor-not-allowed flex items-center gap-1"
            >
              <CreditCard size={14} />
              Add Payment
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-800 dark:text-gray-200 font-medium">
              Cash on Delivery (COD)
            </span>
            <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
              Enabled
              <ToggleRight size={20} className="text-green-500" />
            </span>
          </div>
        </div>

        {/* Guest Checkout */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Guest Checkout
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Allow guest users to place orders
            </p>
            <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
              Enabled
              <ToggleRight size={20} className="text-green-500" />
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            (Disabled toggle — cannot change this in demo mode)
          </p>
        </div>
      </div>
    </section>
  );
}
