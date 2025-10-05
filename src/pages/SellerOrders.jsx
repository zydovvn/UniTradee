import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  User2,
  BadgeDollarSign,
  Hash,
  CalendarClock,
} from "lucide-react";

const API = "http://localhost:5000";
const fmtVND = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));

const STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipped", label: "Đang giao" },
  { value: "completed", label: "Hoàn tất" },
  { value: "canceled", label: "Đã hủy" },
];

const STATUS_CLASS = {
  pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  confirmed: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  shipped: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  completed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  canceled: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

const PLACEHOLDER = "https://via.placeholder.com/600x600.png?text=No+Image";
const normalizeImg = (raw) => {
  if (!raw) return PLACEHOLDER;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${API}/uploads/${raw}`;
};
const calcTotal = (items = []) =>
  items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);

export default function SellerOrders() {
  // ========== GIỮ NGUYÊN LOGIC CŨ ==========
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // 15 item / trang = 5 cột × 3 hàng
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const token = localStorage.getItem("token");
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuFor(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    axios
      .get(`${API}/api/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải đơn hàng bán");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const currentLabel = (status) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.label || status;

  const updateStatus = async (orderId, newStatus) => {
    try {
      setSavingId(orderId);
      await axios.put(
        `${API}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o)));
      setOpenMenuFor(null);
      toast.success("Đã cập nhật trạng thái");
      window.dispatchEvent(new CustomEvent("order-status-updated")); // để Dashboard refresh
    } catch (e) {
      console.error(e);
      toast.error("Cập nhật thất bại");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (!orders.length) return <p className="text-center mt-10">Chưa có đơn bán nào.</p>;

  return (
    <div className="container mx-auto px-6 py-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">💼 Đơn hàng từ sản phẩm bạn bán</h1>

      {/* GRID 5 cột */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {paged.map((o) => {
          // payload mới
          const firstItem = o.items?.[0];
          const imgNew = firstItem?.image_url;
          const nameNew = firstItem?.product_name;
          // payload cũ (giữ nguyên)
          const imgOld = o.product?.image_url;
          const nameOld = o.product?.name;

          const img = normalizeImg(imgNew || imgOld);
          const name = nameOld || nameNew || "Sản phẩm";
          const total = o.total_price ?? calcTotal(o.items);

          return (
            <article key={o.order_id} className="group bg-white shadow-sm hover:shadow-md transition rounded-xl overflow-hidden ring-1 ring-gray-100">
              {/* ảnh + badge + dropdown */}
              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />

                {/* Badge trạng thái (màu) */}
                <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${STATUS_CLASS[o.status] || STATUS_CLASS.pending}`}>
                  {currentLabel(o.status)}
                </span>

                {/* Dropdown cập nhật trạng thái */}
                <div className="absolute top-3 right-3" ref={menuRef}>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuFor((id) => (id === o.order_id ? null : o.order_id))}
                      className="px-2 py-1 rounded bg-white/90 backdrop-blur border text-xs hover:bg-white shadow-sm"
                      disabled={savingId === o.order_id}
                      title="Cập nhật trạng thái"
                    >
                      {savingId === o.order_id ? "Đang lưu..." : "Đổi trạng thái"}
                    </button>

                    <AnimatePresence>
                      {openMenuFor === o.order_id && (
                        <motion.ul
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 4, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 z-20 mt-2 w-48 bg-white border rounded-lg shadow-lg overflow-hidden"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <li key={opt.value}>
                              <button
                                onClick={() => updateStatus(o.order_id, opt.value)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                  opt.value === o.status ? "font-semibold text-orange-600" : ""
                                }`}
                              >
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${
                                    opt.value === "completed"
                                      ? "bg-emerald-500"
                                      : opt.value === "canceled"
                                      ? "bg-rose-500"
                                      : opt.value === "shipped"
                                      ? "bg-indigo-500"
                                      : opt.value === "confirmed"
                                      ? "bg-sky-500"
                                      : "bg-amber-500"
                                  }`}
                                />
                                {opt.label}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* body */}
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-base line-clamp-1">{name}</h2>

                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <User2 className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Người mua:</span>
                    <span className="truncate">{o.buyer_name || o.buyer?.name || "-"}</span>
                    <span className="text-gray-400">-</span>
                    <span>{o.buyer_phone || o.buyer?.phone || "-"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Số sản phẩm:</span>
                    <span>{o.items?.length || 1}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium">Tổng tiền:</span>
                    <span>{fmtVND(total)}</span>
                  </li>
                </ul>

                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  Đặt lúc: {new Date(o.created_at).toLocaleString("vi-VN")}
                </p>

                <div className="pt-1">
                  <Link
                    to={`/orders/${o.order_id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border hover:bg-gray-50 text-sm"
                  >
                    <Hash className="w-4 h-4" />
                    Chi tiết
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Phân trang 1,2,3… */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            «
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded border ${page === i + 1 ? "bg-orange-500 text-white border-orange-500" : ""}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
