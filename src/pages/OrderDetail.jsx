import { useContext, useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function OrderDetail() {
  const { id } = useParams();
  const { user, token, loadingUser } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
      } catch (err) {
        console.error("❌ Lỗi lấy chi tiết đơn:", err);
        toast.error("Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrder();
    else setLoading(false);
  }, [id, token]);

  if (loadingUser) {
    return <p className="text-center py-10">Đang xác thực người dùng...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return <p className="text-center py-10">Đang tải...</p>;
  }
  if (!order) {
    return <p className="text-center py-10">Không tìm thấy đơn hàng.</p>;
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN").format(val || 0) + " ₫";

  const grouped = (order.items || []).reduce((acc, item) => {
    const found = acc.find((i) => i.product_id === item.product_id);
    if (found) {
      found.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-orange-600">📦 Chi tiết đơn hàng</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {grouped.map((it) => (
              <div
                key={it.product_id}
                className="flex gap-4 items-start border-b pb-4"
              >
                <img
                  src={
                    it.image_url
                      ? it.image_url
                      : "/default-img.jpg"
                  }
                  alt={it.product_name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{it.product_name}</h2>
                  <p className="text-gray-600">{it.description}</p>
                  <p className="mt-1">
                    <span className="font-medium">Số lượng:</span> {it.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Đơn giá:</span>{" "}
                    {formatCurrency(it.price)}
                  </p>
                  <p>
                    <span className="font-medium">Tổng:</span>{" "}
                    {formatCurrency(it.price * it.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2">
            <p>
              <span className="font-medium">Trạng thái:</span>{" "}
              <span className="uppercase text-blue-600">{order.status}</span>
            </p>
            <p>
              <span className="font-medium">Tổng hóa đơn:</span>{" "}
              {formatCurrency(grouped.reduce((sum, i) => sum + i.quantity * i.price, 0))}
            </p>
            <div className="pt-3 border-t">
              <h3 className="font-semibold">👤 Người mua</h3>
              <p>{order.buyer_name || "-"}</p>
              <p>{order.buyer_phone || "-"}</p>
            </div>
            <div className="pt-3 border-t">
              <h3 className="font-semibold">🏪 Người bán</h3>
              <p>{order.seller_name || "-"}</p>
              <p>{order.seller_phone || "-"}</p>
            </div>

            {user.id === order.seller_id && (
              <div className="mt-4">
                <label className="block mb-1 font-medium">Cập nhật trạng thái:</label>
                <div className="flex gap-2 items-center">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border px-3 py-2 rounded flex-1"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="shipped">Đang giao</option>
                    <option value="completed">Hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                  <button
                    onClick={() => {
                      // xử lý update
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
