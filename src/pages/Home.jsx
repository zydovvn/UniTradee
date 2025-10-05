import { useEffect, useState, useContext } from "react";
import ProductGrid from "../components/product/ProductGrid.jsx";
import { AuthContext } from "../context/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function Home() {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("latest");
  const [showParticles, setShowParticles] = useState(true);
  const [loading, setLoading] = useState(true);

  // 🔎 Đọc q & category từ URL để đồng bộ với Topbar/Sidebar
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";                 // chuỗi tìm kiếm
  const category = params.get("category") || "";   // SLUG danh mục (không phải id)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = new URL("http://localhost:5000/api/products");
        if (q) url.searchParams.set("q", q);
        if (category) url.searchParams.set("category", category);

        const res = await fetch(url.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Lỗi khi fetch sản phẩm:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    // Mỗi khi URL thay đổi (q/category) sẽ fetch lại
  }, [q, category, token, location.key]);

  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Particles background */}
      {showParticles && (
        <Particles
          id="tsparticles"
          init={async (engine) => {
            await loadSlim(engine);
          }}
          options={{
            fullScreen: false,
            background: { color: "transparent" },
            fpsLimit: 60,
            particles: {
              number: { value: 40 },
              color: { value: "#ff7a18" },
              links: { enable: true, color: "#ff7a18", distance: 120 },
              move: { enable: true, speed: 1.5 },
              size: { value: 3 },
            },
          }}
          className="absolute inset-0 -z-10"
        />
      )}

      {/* Nội dung */}
      <main className="relative z-10 px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-6 border-b relative">
            {["forYou", "latest"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 font-semibold relative ${
                  activeTab === tab
                    ? "text-orange-600"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {tab === "forYou" ? "Dành cho bạn" : "Mới nhất"}
                {activeTab === tab && (
                  <motion.div
                    layoutId="underline-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Toggle particles */}
          <button
            onClick={() => setShowParticles(!showParticles)}
            className="text-sm bg-orange-500 text-white px-4 py-1 rounded-lg hover:bg-orange-600 transition"
          >
            {showParticles ? "Tắt hiệu ứng" : "Bật hiệu ứng"}
          </button>
        </div>

        {/* Trạng thái lọc (nếu có) */}
        {(q || category) && (
          <p className="text-sm text-gray-500 mb-3">
            Lọc theo {q ? <>từ khóa <b>“{q}”</b></> : null}
            {q && category ? " · " : ""}
            {category ? <>danh mục <b>{category}</b></> : null}
          </p>
        )}

        {/* ProductGrid có hiệu ứng khi đổi tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + q + category}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {loading ? (
              <p className="text-center py-10">Đang tải...</p>
            ) : (
              <ProductGrid products={products} setProducts={setProducts} activeTab={activeTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
