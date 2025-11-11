import React, { useContext } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// User pages
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin pages
import Dashboard from "./admin/Dashboard";
import Products from "./admin/Products";
import AddProduct from "./admin/AddProduct";
import Categories from "./admin/Categories";
import AdminOrders from "./admin/Orders";
import AdminLogin from "./admin/AdminLogin";
import Sidebar from "./admin/Sidebar";
import AdminNavbar from "./admin/AdminNavbar";

const queryClient = new QueryClient();

// ProtectedRoute imported below
import ProtectedRoute from "./components/ProtectedRoute"; // if separated
import EditProduct from "./admin/EditProduct";
import Tags from "./admin/Tags";
import AdminLayout from "./components/AdminLayout";
import UserLayout from "./components/UserLayout";
import Checkout from "./pages/Checkout";
import CategoryProducts from "./pages/CategoryProducts";
import AdminCoupons from "./pages/admin/AdminCoupons";
import ForgotPassword from "./pages/ForgotPassword";
import Shop from "./pages/Shop";
import SettingPage from "./pages/admin/SettingPage";



export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>

          <Route element={<UserLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:id" element={<CategoryProducts />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="setting" element={<SettingPage />} />
            <Route path="products">
              <Route index element={<Products />} />
              <Route path=":id" element={<EditProduct />} />
              <Route path="add" element={<AddProduct />} />
            </Route>
            <Route path="categories" element={<Categories />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="tags" element={<Tags />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
