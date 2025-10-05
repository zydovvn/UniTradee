import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar({ selectedCategory, setSelectedCategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/products/categories/all")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  // 🔄 Đồng bộ state với URL mỗi khi thay đổi route/query
  useEffect(() => {
    if (!categories.length) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get("category"); // null nếu không có
    if (slug) {
      const cat = categories.find((c) => c.slug === slug);
      setSelectedCategory?.(cat ? cat.id : null);
    } else {
      setSelectedCategory?.(null); // về “Tất cả”
    }
  }, [location.search, categories, setSelectedCategory]);

  const applyCategory = (cat) => {
    setSelectedCategory?.(cat?.id || null);
    const params = new URLSearchParams(location.search);
    if (cat?.slug) params.set("category", cat.slug);
    else params.delete("category");

    // nếu đang ở trang chủ, điều hướng sang /products để hiển thị grid
    const path = location.pathname === "/" ? "/products" : location.pathname;
    navigate(`${path}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-24 left-2 z-[60] bg-gradient-to-r from-orange-500 to-yellow-400 text-white p-2 rounded-full shadow hover:opacity-90 transition"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-0 h-full w-60 bg-gradient-to-b from-orange-500 to-yellow-400 text-white shadow-xl z-[55] flex flex-col"
          >
            <div className="flex items-center justify-center py-4 border-b border-white/20">
              <h2 className="text-lg font-bold">Danh mục</h2>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              <button
                onClick={() => applyCategory(null)}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  !selectedCategory ? "bg-white text-orange-600 font-semibold" : "hover:bg-white/20"
                }`}
              >
                Tất cả
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => applyCategory(cat)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === cat.id
                      ? "bg-white text-orange-600 font-semibold"
                      : "hover:bg-white/20"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
