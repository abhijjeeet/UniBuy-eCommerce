import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Headphones, Shield, Truck, X, TrendingUp,
  Sparkles,
} from "lucide-react";
import Api from "../constants/Api";
import {
  getAllProducts, getCategories, addToWishlist,
} from "../services/apiServices";
import ProductCard from "../components/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import Hero from "../components/Home/Hero";
import Loader from "../components/Loader";



const PromoBanner = ({ onDismiss, isDismissed }) => {
  if (isDismissed) return null;
  return (
    <div role="banner" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-center">
      <div className="relative mx-auto max-w-7xl">
        <p className="text-sm font-medium">
          🎓 Student Special: Extra 15% off — Code: <span className="font-extrabold">STUDENT15</span>
        </p>
        <button onClick={onDismiss} className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};



/* Benefits strip */
const FeaturesBar = () => {
  const items = [
    {
      icon: Truck,
      title: "Free Delivery",
      desc: "On orders over ₹2000",
      color: "text-blue-600",
      bg: "from-blue-100 to-indigo-100",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      desc: "PCI-DSS compliant",
      color: "text-purple-600",
      bg: "from-purple-100 to-pink-100",
    },
    {
      icon: Headphones,
      title: "24x7 Support",
      desc: "We’re here to help",
      color: "text-orange-600",
      bg: "from-orange-100 to-red-100",
    },
    {
      icon: Sparkles,
      title: "Easy Returns",
      desc: "Hassle-free 7-day returns",
      color: "text-green-600",
      bg: "from-green-100 to-emerald-100",
    },
  ];

  return (
    <section className="bg-white border-y border-gray-200 py-6">
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 px-6">
        {items.map(({ icon: Icon, title, desc, color, bg }, k) => (
          <div
            key={k}
            className="flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-white"
          >
            <div
              className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${bg} grid place-items-center transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon size={22} className={`${color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* 🧭 Modern Sticky FiltersBar (Flipkart-like full-width) */

const FiltersBar = ({
  categories,
  activeCatId,
  setActiveCatId,
  sort,
  setSort,
  price,
  setPrice,
}) => (
  <div className="sticky top-[66px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
      {/* Sort dropdown */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
        <SlidersHorizontal size={16} className="text-gray-500" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm font-medium bg-transparent outline-none appearance-none cursor-pointer"
        >
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price — Low to High</option>
          <option value="price_desc">Price — High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Scrollable categories */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0">
        <button
          onClick={() => setActiveCatId("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${!activeCatId
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          All
        </button>
        {categories.slice(0, 15).map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCatId(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeCatId === c.id
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-600 font-medium">Max Price:</span>
        <div className="flex items-center border border-gray-200 rounded-full px-3 py-1.5 bg-white shadow-sm hover:shadow-md transition">
          <span className="text-gray-500 text-sm mr-1.5">₹</span>
          <input
            type="number"
            min="0"
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            placeholder="Enter"
            className="w-20 text-sm text-gray-700 bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  </div>
);



/* Top Deals – category cards (image + discount) */
const CategoryStrip = ({ categories, products, onClick }) => {
  const cards = useMemo(() =>
    categories.map((cat) => {
      const prod = products.find((p) => p?.categories?.some((c) => c.id === cat.id));
      const fp = prod?.files?.[0]?.path?.replace(/\\/g, "/");
      const image = (fp && `${Api.BACKEND_URL}${fp}`) || prod?.imageUrl || "https://via.placeholder.com/300x200?text=Category";
      let discount = "Up to 40% Off";
      if (prod?.mrp && prod?.price && prod.mrp > prod.price) {
        const pct = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
        discount = `${pct}% Off`;
      } else if (prod?.discountPct) discount = `${Math.round(prod.discountPct)}% Off`;
      return { id: cat.id, name: cat.name, image, discount };
    }), [categories, products]);

  return (
    <section className="bg-white py-6">
      <div className=" mx-auto px-6">

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {cards.map((card) => (
            <button key={card.id} onClick={() => onClick({ id: card.id, name: card.name })}
              className="group text-left bg-white rounded-md border border-gray-200 hover:shadow-md transition overflow-hidden">
              <div className="w-full aspect-[4/3] bg-gray-50">
                <img src={card.image} alt={card.name}
                  className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition"
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x200?text=Category")} />
              </div>
              <div className="p-3">
                <p className="text-gray-900 text-sm font-semibold truncate">{card.name}</p>
                <p className="text-green-600 text-xs mt-0.5 font-medium">{card.discount}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductSection = ({ title, products, onWishlist }) => (
  <section id="products" className="mx-auto px-6 py-8" aria-label={title}>
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onWishlist={onWishlist} />
      ))}
    </div>
  </section>
);

export default function Home() {
  const navigate = useNavigate();
  const { data: products = [], isPending } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });
  const { data: categories = [], isPending: isCatPending } = useSuspenseQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [promoDismissed, setPromoDismissed] = useState(() => {
    try {
      return localStorage.getItem("promoDismissed") === "1";
    } catch {
      return false;
    }
  });
  const [activeCatId, setActiveCatId] = useState("");
  const [sort, setSort] = useState("relevance");
  const [price, setPrice] = useState(0);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCatId)
      list = list.filter((p) =>
        p?.categories?.some((c) => c.id === activeCatId)
      );
    if (price > 0) list = list.filter((p) => Number(p.price) <= price);
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
    return list;
  }, [products, activeCatId, price, sort]);

  const onCategoryClick = (cat) => navigate(`/category/${cat.id}`);
  const onDismissPromo = () => {
    setPromoDismissed(true);
    try {
      localStorage.setItem("promoDismissed", "1");
    } catch { }
  };

  const handleWishlist = async (productId) => {
    await addToWishlist({ productId });
  };



  // 🏷 Thematic product groups
  // const topDeals = filtered.slice(0, 8);
  // const trending = filtered.slice(8, 16);
  // const newArrivals = filtered.slice(16, 24);
  // const budgetBuys = filtered
  const topDeals = filtered;
  const trending = filtered
  const newArrivals = filtered
  const budgetBuys = filtered
    .filter((p) => Number(p.price) < 1500)
    .slice(0, 8);


  if (isPending || isCatPending) return <Loader />
  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-900">
      <PromoBanner onDismiss={onDismissPromo} isDismissed={false} />

      <main>
        {/* Category Row */}
        <CategoryStrip
          categories={categories}
          products={products}
          onClick={onCategoryClick}
        />

        {/* Hero Banner */}
        <Hero />

        {/* Filters */}
        <FiltersBar
          categories={categories}
          activeCatId={activeCatId}
          setActiveCatId={setActiveCatId}
          sort={sort}
          setSort={setSort}
          price={price}
          setPrice={setPrice}
        />

        {/* 🎯 Product Sections */}
        <ProductSection
          title="Top Deals Today"
          products={topDeals}
          onWishlist={handleWishlist}
        />

        <ProductSection
          title="New Arrivals"
          products={newArrivals}
          onWishlist={handleWishlist}
        />

        <ProductSection
          title="Trending Now"
          products={trending}
          onWishlist={handleWishlist}
        />

        <ProductSection
          title="Budget Buys Under ₹1500"
          products={budgetBuys}
          onWishlist={handleWishlist}
        />

        {/* Optionally re-enable */}
        {/* <FeaturesBar /> */}
      </main>
    </div>
  );
}

