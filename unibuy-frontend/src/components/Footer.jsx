// src/components/user/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid sm:grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">UniBuy</h3>
          <p>Bringing quality products to your fingertips. Fast, reliable, and secure shopping experience.</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Quick Links</h3>
          <ul className="space-y-1">
            <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
            <li><Link to="/wishlist" className="hover:text-blue-600">Wishlist</Link></li>
            <li><Link to="/orders" className="hover:text-blue-600">My Orders</Link></li>
            <li><Link to="/cart" className="hover:text-blue-600">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
          <ul className="space-y-1">
            <li>Email: support@unibuy.in</li>
            <li>Phone: +91 9876543210</li>
            <li>Address: Dehradun, Uttarakhand</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-3 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} UniBuy. All rights reserved.
      </div>
    </footer>
  );
}
