import axios from "axios";
import Api from "../constants/Api";

const baseURL = Api.BACKEND_URL;

const apiClient = axios.create({ baseURL });

// Get token
const getAuthToken = () => localStorage.getItem("token");

/**
 * Generic API handler with token handling
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {string} url - API endpoint
 * @param {Object|FormData} [data] - Request payload
 */
export const apiRequest = async (method, url, data = null) => {
  try {
    const token = getAuthToken();
    const isFormData = data instanceof FormData;

    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" }),
    };

    const response = await apiClient({
      method,
      url,
      data,
      headers,
    });

    return response.data;
  } catch (error) {
    console.error(`API error [${method} ${url}]:`, error.response?.data || error.message);
    throw error;
  }
};
