import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  // cờ chờ khôi phục phiên khi F5
  const [loadingUser, setLoadingUser] = useState(true);

  // luôn đồng bộ header Authorization cho axios khi token đổi
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // Rehydrate phiên khi app mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoadingUser(false);
      return;
    }
    setToken(storedToken);
    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
        
      })
      
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("❌ Token không hợp lệ:", err?.message);
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error("❌ Lỗi login:", err.message);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", userData);
      return true;
    } catch (err) {
      console.error("❌ Lỗi register:", err.message);
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/update-profile",
        profileData
      );
      setUser(res.data.user);
      return true;
    } catch (err) {
      console.error("❌ Lỗi update profile:", err.message);
      return false;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await axios.post("http://localhost:5000/api/users/change-password", {
        oldPassword,
        newPassword,
      });
      return true;
    } catch (err) {
      console.error("❌ Lỗi change password:", err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loadingUser,     // <— PrivateRoute sẽ chờ cờ này
        setUser,          // <— expose để Profile dùng
        setToken,         // (tuỳ chọn) có thể hữu ích nơi khác
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
