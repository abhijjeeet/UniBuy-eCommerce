import React, { createContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../services/apiServices";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  // ✅ Fetch profile only when token exists
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
      if (data.role) setRole(data.role);
    }

    if (error?.response?.status === 401) {
      logout();
    }
  }, [data, error]);

  // ✅ Login handler
  const login = (newToken, roleFromServer) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", roleFromServer);
    setToken(newToken);
    setRole(roleFromServer);
    refetch(); // fetch profile immediately
  };

  // ✅ Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setRole(null);

    // Redirect safely
    if (role === "ADMIN") {
      window.location.href = "/admin/login";
    } else {
      window.location.href = "/login";
    }
  };

  // ✅ Loading while fetching profile
  const loading = !!token && isFetching;

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// import React, { createContext, useEffect, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { getProfile } from "../services/apiServices";

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(localStorage.getItem("token") || null);
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(localStorage.getItem("role") || null);

//   // fetch profile only when token exists
  // const { data, error, isFetching, refetch } = useQuery({
  //   queryKey: ["profile"],
  //   queryFn: getProfile,
  //   enabled: !!token,
  //   retry: false,
  // });

//   useEffect(() => {
//     if (data) setUser(data);
//     if (error?.response?.status === 401) {
//       logout();
//     }
//   }, [data, error]);

//   const login = (token, roleFromServer) => {
//     localStorage.setItem("token", token);
//     localStorage.setItem("role", roleFromServer);
//     setToken(token);
//     setRole(roleFromServer);
//     refetch();
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role");
//     setToken(null);
//     setUser(null);
//     setRole(null);
//     window.location.href = role === "ADMIN" ? "/admin/login" : "/login";
//   };

//   const loading = !!token && isFetching;

//   return (
//     <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
