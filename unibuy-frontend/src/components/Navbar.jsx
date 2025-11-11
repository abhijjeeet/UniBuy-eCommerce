import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">UniBuy</Link>
      <div className="flex gap-6 items-center text-sm">
        <Link to="/">Home</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart</Link>
        {user ? (
          <>
            <Link to="/orders">{user.name?.split(" ")[0]}</Link>
            <button
              onClick={logout}
              className="bg-white text-blue-600 px-3 py-1 rounded-md"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="bg-white text-blue-600 px-3 py-1 rounded-md">
              Login
            </Link>
            <Link to="/register" className="underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
