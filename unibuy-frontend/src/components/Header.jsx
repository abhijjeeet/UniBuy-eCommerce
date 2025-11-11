import React, { useState, useEffect, useRef, Suspense } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  LogOut,
  Search,
  PackageSearch,
} from "lucide-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getProfile, getSuggestions } from "../services/apiServices";
import Api from "../constants/Api";
import { getGuestCart } from "../utils/cartStorage";

export default function Header() {
  const navigate = useNavigate();
const [guestCart, setGuestCart] = useState(getGuestCart());


  const token = localStorage.getItem("token");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);


  useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === "guestCart") {
      setGuestCart(getGuestCart());
    }
  };
  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);


  const { data } = useSuspenseQuery({
    queryKey: ["suggestions", debounced],
    queryFn: () => getSuggestions(debounced),
    enabled: debounced.length >= 2,
  });


  const { data: userData, error, isFetching, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setShowDropdown(false);
    if (item.type === "category") navigate(`/category/${item.id}`);
    else navigate(`/product/${item.id}`);
  };

  const handleLogin = () => navigate("/login");
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-6 lg:px-12 h-[68px] w-full gap-6">
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center gap-1 text-[22px] font-extrabold text-blue-600 hover:text-blue-700"
        >
          Uni<span className="text-gray-800">Buy</span>
          <span className="ml-1 text-[11px] text-yellow-500 font-semibold tracking-tight">
            Explore <span className="text-blue-500">Plus ✨</span>
          </span>
        </Link>

        {/* SEARCH BAR */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl hidden md:flex">
          <div className="relative w-full">
            <Search size={18} className="absolute left-4 top-3 text-gray-400" />
            <input
              type="text"
              value={query}
              placeholder="Search for products, brands and more"
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#f0f5ff] rounded-md py-2.5 pl-10 pr-4 text-[14px] text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {showDropdown && debounced.length >= 2 && (
              <Suspense
                fallback={
                  <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-3 text-sm text-gray-500 z-50">
                    Searching...
                  </div>
                }
              >
                <SuggestionList data={data} onSelect={handleSelect} />
              </Suspense>
            )}
          </div>
        </div>

        {/* RIGHT SIDE ICONS */}
        <div className="flex items-center gap-8">
          {/* Login Dropdown */}
          <div className="relative">
            {token ? (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition"
              >
                <User size={20} /> Account
                <ChevronDown size={16} />
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition"
              >
                <User size={18} />
                <span className="text-[14px] font-medium">Login</span>
              </button>
            )}

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg border border-gray-200 rounded-md py-2 animate-fadeIn">


                <NavLink
                  to="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Hello    {userData.name || "Profile"}
                </NavLink>

                <NavLink
                  to="/shop"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Shop
                </NavLink>
                <NavLink
                  to="/orders"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  My Orders
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <NavLink
            to="/wishlist"
            className="flex items-center gap-2 text-gray-800 hover:text-red-500 transition"
          >
            <Heart size={20} />
            <span className="text-[14px] font-medium">Wishlist</span>
          </NavLink>

          {/* Cart */}
          <NavLink
            to="/cart"
            className="relative flex items-center gap-2 text-gray-800 hover:text-blue-600 transition"
          >
            <ShoppingCart size={20} />
            <span className="text-[14px] font-medium">Cart</span>

            {/* Cart count badge */}
            {userData && userData?.cartItems?.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
                {userData.cartItems.length}
              </span>
            )}
            { guestCart.length > 0 &&

              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
                {guestCart.length}
              </span>
            }
          </NavLink>

        </div>
      </div>
    </header>
  );
}

/* Suggestions dropdown */
function SuggestionList({ data, onSelect }) {
  if (!data?.suggestions?.length)
    return (
      <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 text-gray-500 text-sm p-4 text-center z-50">
        <PackageSearch className="w-5 h-5 inline-block mr-1 text-gray-400" />
        No results found
      </div>
    );

  return (
    <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md shadow-xl mt-1 max-h-80 overflow-auto z-50 divide-y divide-gray-100">
      {data.suggestions.map((item, i) => (
        <li
          key={`${item.type}-${item.id}-${i}`}
          onClick={() => onSelect(item)}
          className="px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition cursor-pointer group"
        >
          {item.type === "product" ? (
            <>
              <div className="flex-shrink-0">
                {item.fileUrl ? (
                  <img
                    src={Api.BACKEND_URL + item.fileUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                    <PackageSearch size={18} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-800 text-sm font-medium group-hover:text-blue-600 transition">
                  {item.name}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {item.type}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded text-blue-700 font-semibold text-base">
                {item.name?.[0] || "?"}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-800 text-sm font-medium group-hover:text-blue-600 transition">
                  {item.name}
                </span>
                <span className="text-xs text-gray-500">Category</span>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
