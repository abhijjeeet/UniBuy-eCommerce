import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getCart, getProfile, placeOrder, validateCoupon } from "../services/apiServices";
import { getGuestCart, clearGuestCart } from "../utils/cartStorage";
import Loader from "../components/Loader";
import {
  Lock,
  ShieldCheck,
  Truck,
  Percent,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CreditCard,
} from "lucide-react";

/** INR formatter */
const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function Checkout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ------------------------------------------------------------------------ */
  /* Data: cart (backend or guest)                                            */
  /* ------------------------------------------------------------------------ */
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (token) {
          const data = await getCart();
          if (mounted) setCart(Array.isArray(data) ? data : []);
        } else {
          if (mounted) setCart(getGuestCart());
        }
      } catch {
        if (mounted) setCart(getGuestCart());
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [token]);

  /* ------------------------------------------------------------------------ */
  /* Coupon                                                                   */
  /* ------------------------------------------------------------------------ */
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponStatus, setCouponStatus] = useState({ state: "idle", msg: "" });

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const unitPrice =
        item.variant?.price ??
        item.product?.price ??
        item.price ??
        0;
      return sum + unitPrice * (item.quantity || 1);
    }, 0);
  }, [cart]);

  const total = Math.max(0, subtotal - discount);

  const onApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponStatus({ state: "error", msg: "Enter a coupon code" });
      return;
    }
    setCouponStatus({ state: "loading", msg: "Validating coupon…" });
    try {
      const res = await validateCoupon(couponCode.trim());
      const pct = Number(res?.discountPct || 0);
      const disc = Math.floor((subtotal * pct) / 100);
      setDiscount(disc);
      setDiscountPct(pct);
      setCouponStatus({
        state: "success",
        msg: `Coupon applied! You saved ${inr(disc)} (${pct}% off)`,
      });
    } catch (err) {
      setDiscount(0);
      setDiscountPct(0);
      setCouponStatus({
        state: "error",
        msg: err?.response?.data?.message || "Invalid or expired coupon",
      });
    }
  };



const { data: profile } = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
  enabled: !!token,
  retry: false,
});

  /* ------------------------------------------------------------------------ */
  /* Order placement                                                          */
  /* ------------------------------------------------------------------------ */
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const orderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: (data) => {
      clearGuestCart();
      setOrderDetails(data);
      setShowConfirm(true);
    },
  });

  /* ------------------------------------------------------------------------ */
  /* Form + validation                                                        */
  /* ------------------------------------------------------------------------ */
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    landmark: "",
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1 = address form, 2 = payment

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onNextStep = () => {
    if (validate()) setStep(2);
  };

  const onPlaceOrder = async () => {
    const items = cart.map((item) => ({
      productId: item.product?.id || item.id,
      quantity: item.quantity || 1,
      variantId: item.variant?.id ?? item.variantId ?? null,
      sku: item.variant?.sku ?? item.sku ?? null,
      variantSelection: item.variantSelection ?? null,
    }));

    await orderMutation.mutateAsync({
      ...form,
      totalPrice: total,
      couponCode: couponCode || null,
      items,
    });
  };


   useEffect(() => {
  if (token && profile) {
    setForm((prev) => ({
      ...prev,
      email: profile.email || prev.email,
      fullName: profile.name || prev.fullName,
      phone: profile.phone || prev.phone,
    }));
  }
}, [token, profile]);



  if (loading) return <Loader />;

  if (!cart.length)
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <CheckCircle2 className="mb-3 text-gray-300" size={48} />
        <h2 className="text-xl font-semibold text-gray-800">Your cart is empty</h2>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Continue Shopping
          <ChevronRight className="ml-1" size={16} />
        </Link>
      </section>
    );

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */
  return (
    <>
      <section className="bg-gray-50 dark:bg-gray-900 py-6 md:py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-center gap-6 text-sm">
            <div className={`flex items-center gap-2 ${step === 1 ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${step === 1 ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-700"} font-semibold`}>
                1
              </span>
              Details
            </div>
            <ChevronRight className="text-gray-400" size={16} />
            <div className={`flex items-center gap-2 ${step === 2 ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${step === 2 ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-700"} font-semibold`}>
                2
              </span>
              Payment
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-center text-gray-900 dark:text-white">
            Secure Checkout
          </h1>

          {step === 1 ? (
            /* ---------------- STEP 1: Address Details ---------------- */
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Fieldset title="Contact" subtitle="We’ll email your order updates">
                  <Input label="Full Name" name="fullName" value={form.fullName} onChange={onChange} error={errors.fullName} required />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Email" type="email" name="email" value={form.email} onChange={onChange} error={errors.email} required />
                    <Input label="Phone" name="phone" value={form.phone} onChange={onChange} error={errors.phone} required />
                  </div>
                </Fieldset>

                <Fieldset title="Shipping Address" subtitle="Delivery in 2–5 business days" icon={<Truck className="text-indigo-600" size={18} />}>
                  <Textarea label="Address" name="address" rows={2} value={form.address} onChange={onChange} error={errors.address} required />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="City" name="city" value={form.city} onChange={onChange} error={errors.city} required />
                    <Input label="State" name="state" value={form.state} onChange={onChange} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Postal Code" name="postalCode" value={form.postalCode} onChange={onChange} />
                    <Input label="Landmark (optional)" name="landmark" value={form.landmark} onChange={onChange} />
                  </div>
                </Fieldset>

                <button
                  type="button"
                  onClick={onNextStep}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  Continue to Payment
                </button>
              </div>

              <OrderSummary {...{ cart, subtotal, discount, discountPct, couponCode, setCouponCode, couponStatus, onApplyCoupon, total }} />
            </div>
          ) : (
            /* ---------------- STEP 2: Payment Screen ---------------- */
            <div className="mt-12 max-w-lg mx-auto rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white text-center">
                Select Payment Method
              </h2>

              {/* Payment Option Card */}
              <div className="relative border border-emerald-300 rounded-2xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-gray-800 p-5 flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-800 grid place-items-center">
                    <CreditCard className="text-emerald-700 dark:text-emerald-300" size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pay easily when your order arrives at your doorstep.
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked
                  readOnly
                  className="h-5 w-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Confirm Button */}
              <button
                onClick={onPlaceOrder}
                disabled={orderMutation.isPending}
                className="mt-8 w-full rounded-xl bg-indigo-600 py-3.5 text-lg font-semibold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-60"
              >
                {orderMutation.isPending ? "Placing Order…" : "Confirm Order"}
              </button>

              {/* Back Button */}
              <button
                onClick={() => setStep(1)}
                className="mt-5 w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition"
              >
                ← Back to Details
              </button>
            </div>

          )}
        </div>
      </section>

      {/* ✅ Confirmation Modal */}
      {showConfirm && orderDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="text-center">
              <CheckCircle2 className="text-green-500 mx-auto mb-4" size={60} />
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Order Confirmed!</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300 text-base">
                Thank you for your purchase! Your order has been successfully placed.
              </p>
            </div>

            {/* Order Details */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-800 dark:text-gray-200">
                <p><strong>Order ID:</strong> {orderDetails.id || "N/A"}</p>
                <p><strong>Total Amount:</strong> {inr(orderDetails.totalPrice || total)}</p>
                <p><strong>Payment Method:</strong> Cash on Delivery</p>
                <p><strong>Order Status:</strong> <span className="text-emerald-600 font-semibold">Confirmed</span></p>
              </div>

              <div className="mt-4 border-t pt-4 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Delivery Address:</p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {form.fullName}<br />
                  {form.address}, {form.city}, {form.state} - {form.postalCode}<br />
                  📞 {form.phone}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                onClick={() => navigate("/orders")}
                className="w-full sm:w-auto rounded-lg border border-indigo-600 text-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto rounded-lg bg-indigo-600 text-white px-6 py-2.5 font-semibold hover:bg-indigo-700 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

/* --------------------------- UI Helper Components --------------------------- */
function Fieldset({ title, subtitle, children, icon }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
        {icon}
        {title}
      </legend>
      {subtitle && <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Input({ label, name, type = "text", value, onChange, error, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:text-white ${error ? "border-red-400" : "border-gray-300"
          }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({ label, name, value, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        name={name}
        rows={2}
        value={value}
        onChange={onChange}
        className={`w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:text-white ${error ? "border-red-400" : "border-gray-300"
          }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function OrderSummary({
  cart,
  subtotal,
  discount,
  discountPct,
  couponCode,
  setCouponCode,
  couponStatus,
  onApplyCoupon,
  total,
}) {
  return (
    <aside className="lg:sticky lg:top-6 h-max rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Summary</h2>
      <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
        {cart.map((item) => {
          const product = item.product || item;
          return (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <span className="text-gray-800 dark:text-gray-100">{product.name}</span>
              <span>
                {inr(((item.variant?.price ?? product.price ?? 0) * (item.quantity || 1)))}
              </span>
              {item.variant && (
                <p className="text-xs text-gray-500">
                  {item.variant.optionType}: {item.variant.optionValue}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Coupon */}
      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Have a coupon?</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="Enter code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 border rounded-lg p-2 text-sm dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="bg-emerald-600 text-white px-4 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Apply
          </button>
        </div>
        {couponStatus.state !== "idle" && (
          <p
            className={`mt-2 text-xs ${couponStatus.state === "success" ? "text-emerald-600" : "text-red-600"
              }`}
          >
            {couponStatus.msg}
          </p>
        )}
      </div>

      <div className="mt-4 border-t pt-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{inr(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount ({discountPct}%)</span>
            <span>-{inr(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900 dark:text-white">
          <span>Total</span>
          <span>{inr(total)}</span>
        </div>
      </div>
    </aside>
  );
}
