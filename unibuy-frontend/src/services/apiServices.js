import { apiRequest } from "./baseService";



export const loginUser = (body) => apiRequest("POST", "/auth/login", body);
export const registerUser = (body) => apiRequest("POST", "/auth/register", body);
export const sendOtp = (body) => apiRequest("POST", "/auth/send-otp", body);
export const verifyOtp = (body) => apiRequest("POST", "/auth/verify-otp", body);
export const getProfile = () => apiRequest("GET", "/user/profile");

export const createFile = (body) => apiRequest("POST", "/uploads", body);
export const getSuggestions = (q) => apiRequest("GET", `/user/product/suggestions?q=${encodeURIComponent(q)}`, {});

export const getAllProducts = () => apiRequest("GET", "/user/product");
export const getProductById = (id) => apiRequest("GET", `/user/product/single?id=${id}`);
export const getCategories = () => apiRequest("GET", "/user/category");
export const getTags = () => apiRequest("GET", "/user/tag");

export const validateCoupon = (code) => apiRequest("GET", `/user/order/coupon/validate?code=${code}`);

export const getCoupons = () => apiRequest("GET", "/admin/coupons");
export const createCoupon = (body) => apiRequest("POST", "/admin/coupons", body);

export const deleteCoupon = (id) => apiRequest("DELETE", `/admin/coupons?id=${id}`, {});

export const getCart = () => apiRequest("GET", "/user/cart");
export const addToCart = (body) => apiRequest("POST", "/user/cart", body);
export const updateCartItem = (body) => apiRequest("PATCH", "/user/cart", body);
export const removeCartItem = (id) => apiRequest("DELETE", `/user/cart?id=${id}`,{});

export const getWishlist = () => apiRequest("GET", "/user/wishlist");
export const addToWishlist = (body) => apiRequest("POST", "/user/wishlist", body);
export const removeFromWishlist = (id) => apiRequest("DELETE", `/user/wishlist?id=${id}`, {});

export const resetPassword = (body) =>
    apiRequest("POST", "/auth/reset-password", body);

export const getOrders = () => apiRequest("GET", "/user/order");
export const placeOrder = (body) => apiRequest("POST", "/user/order", body);

export const adminGetProducts = () => apiRequest("GET", "/admin/product");
export const adminGetProductById = (id) => apiRequest("GET", `/admin/product?id=${id}`);
export const adminCreateProduct = (body) => apiRequest("POST", "/admin/product", body);
export const adminUpdateProduct = (body) => apiRequest("PATCH", "/admin/product", body);
export const adminDeleteProduct = (id) => apiRequest("DELETE", `/admin/product?id=${id}`);

export const adminGetOrders = () => apiRequest("GET", "/admin/order");
export const adminUpdateOrder = (body) => apiRequest("PATCH", "/admin/order", body);


export const getProductsAdmin = () => apiRequest("GET", "/admin/product");
export const createProductAdmin = (body) => apiRequest("POST", "/admin/product", body);
export const deleteProductAdmin = (id) => apiRequest("DELETE", `/admin/product?id=${id}`, {});

export const getCategoriesAdmin = () => apiRequest("GET", "/admin/category");
export const createCategoryAdmin = (body) => apiRequest("POST", "/admin/category", body);
export const updateCategoryAdmin = (body) => apiRequest("PATCH", "/admin/category", body);
export const deleteCategoryAdmin = (id) => apiRequest("DELETE", `/admin/category?id=${id}`);

export const getTagsAdmin = () => apiRequest("GET", "/admin/tag");
export const createtagAdmin = (body) => apiRequest("POST", "/admin/tag", body);
export const updatetagAdmin = (body) => apiRequest("PATCH", "/admin/tag", body);
export const deletetagAdmin = (id) => apiRequest("DELETE", `/admin/tag?id=${id}`);


export const getOrdersAdmin = () => apiRequest("GET", "/admin/order");
export const updateOrderAdmin = (body) => apiRequest("PATCH", "/admin/order", body);