import { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  Heart,
  MessageCircle,
  PlusCircle,
  User,
  ListChecks,
  BarChart3,
  LogOut,
  Shield,
  Search,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "http://localhost:5000";

export default function Topbar() {
  const { user, logout, token } = useContext(AuthContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // search state
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // shrink on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔄 Đồng bộ role khi chuyển tab/trở lại cửa sổ (trường hợp bạn mới update role từ DB)
  useEffect(() => {
    const onFocus = async () => {
      if (!token) return;
      try {
        const me = await axios.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // AuthContext đã tự set user trong lần mount; ở đây chỉ đảm bảo dữ liệu luôn mới.
        // Không cần set lại vì AuthContext đang quản; tuỳ bạn muốn thì có thể expose setUser.
      } catch {}
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [token]);

  // search suggest
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/api/products/search`, {
          params: { q: searchTerm },
        });
        setSuggestions((res.data || []).slice(0, 6));
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err?.message);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSuggestions([]);
  };

  return (
    <header className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-md sticky top-0 z-50">
      <div className={`transition-all duration-300 ${isScrolled ? "py-2" : "py-4"}`}>
        <div className="container mx-auto flex items-center justify-between px-6 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="UniTrade"
              className="h-12 w-12 object-contain bg-white rounded-full shadow"
            />
            <span className="text-2xl font-bold">
              Uni<span className="text-yellow-200">Trade</span>
            </span>
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className={`relative flex bg-white rounded-full shadow overflow-hidden transition-all duration-300 ${
              isScrolled ? "w-1/2" : "w-2/3"
            }`}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm kiếm sản phẩm..."
              className="flex-1 px-4 py-2 text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-orange-600 px-5 font-semibold hover:bg-orange-700 transition"
            >
              Tìm
            </button>

            {/* Gợi ý */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 w-full bg-white text-gray-800 rounded-lg shadow-lg z-50 mt-1 overflow-hidden"
                >
                  {loading ? (
                    <li className="px-4 py-3 text-center text-sm text-gray-500">
                      Đang tìm kiếm...
                    </li>
                  ) : (
                    suggestions.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                        onClick={() => navigate(`/products/${p.id}`)}
                      >
                        <img
                          src={
                            p.image_url ||
                            "https://via.placeholder.com/80x80?text=No+Image"
                          }
                          alt={p.name}
                          className="w-10 h-10 rounded object-cover border"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Intl.NumberFormat("vi-VN").format(p.price || 0)} đ
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </form>

          {/* Right menu */}
          <div className="flex items-center gap-4 ml-4">
            <Link to="/favorites" aria-label="Tin yêu thích" className="group">
              <Heart className="w-7 h-7 transition group-hover:scale-110 text-pink-100" />
            </Link>
            <Link to="/messages" aria-label="Tin nhắn" className="group">
              <MessageCircle className="w-7 h-7 transition group-hover:scale-110 text-blue-100" />
            </Link>
            <Link to="/post/create" aria-label="Đăng bài" className="group">
              <PlusCircle className="w-7 h-7 transition group-hover:scale-110 text-emerald-100" />
            </Link>

            {/* User dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <span className="hidden md:block font-medium">
                    Xin chào, {user.username || user.email}
                  </span>
                  <User className="w-8 h-8 hover:text-gray-200 transition" />
                  {user?.role?.toLowerCase() === "admin" && (
                    <CheckCircle2
                      className="w-4 h-4 text-green-300 ml-1"
                      title="Admin verified"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white text-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <User className="w-4 h-4 text-sky-500" />
                        Hồ sơ chi tiết
                      </Link>

                      <Link
                        to="/myposts"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-500" />
                        Tin đã đăng
                      </Link>

                      <Link
                        to="/favorites"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <Heart className="w-4 h-4 text-pink-500" />
                        Tin yêu thích
                      </Link>

                      <Link
                        to="/orders/buyer"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <ListChecks className="w-4 h-4 text-indigo-600" />
                        Đơn hàng của tôi
                      </Link>

                      <Link
                        to="/seller/orders"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <ListChecks className="w-4 h-4 text-purple-600" />
                        Quản lý đơn bán
                      </Link>

                      <Link
                        to="/seller/dashboard"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                        onClick={() => setOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        Bảng điều khiển bán hàng
                      </Link>

                      {user?.role?.toLowerCase() === "admin" && (
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 font-medium"
                          onClick={() => setOpen(false)}
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Quản trị người dùng
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold hover:bg-yellow-100 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full font-semibold border border-white/70 hover:bg-white/10 transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slogan ở trang Home */}
      <AnimatePresence>
        {location.pathname === "/" && !isScrolled && (
          <motion.div
            key="slogan"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto text-center px-6 pb-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow">
              UniTrade – <span className="text-yellow-100">An Toàn - Tiện Lợi – Tin Cậy</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Sàn Thương Mại Điện Tử Dành Cho Sinh Viên
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
