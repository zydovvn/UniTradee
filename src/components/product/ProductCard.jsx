import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);

// ---- Modal Sửa đơn giản ----
function EditModal({ open, onClose, product, onSaved }) {
  const { token } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    price: product?.price ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      // Gửi JSON (nếu cần gửi ảnh, có thể chuyển sang FormData)
      const { data } = await axios.put(
        `http://localhost:5000/api/products/${product.id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã cập nhật sản phẩm");
      onSaved?.(data);
      onClose();
    } catch (err) {
      console.error("❌ Lỗi cập nhật sản phẩm:", err);
      toast.error("Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded p-5">
        <h3 className="text-lg font-semibold mb-4">Sửa sản phẩm</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Tên"
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            name="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={onChange}
            placeholder="Giá"
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            name="category_id"
            type="number"
            value={form.category_id}
            onChange={onChange}
            placeholder="Category ID"
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Mô tả"
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductCard({
  product,
  onToggleFavorite,
  ownerView = false,       // 🆕 truyền true ở trang MyPosts
  onDeleted,               // 🆕 callback sau khi xóa
  onUpdated,               // 🆕 callback sau khi sửa
}) {
  const { user, token } = useContext(AuthContext);
  const [isFav, setIsFav] = useState(product.isFavorite || false);
  const [loading, setLoading] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const toggleFavorite = async () => {
    if (ownerView) return; // ở MyPosts ẩn tim, nhưng đề phòng click
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để yêu thích sản phẩm.");
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      if (isFav) {
        await axios.delete(
          `http://localhost:5000/api/products/favorites/${product.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast("💔 Đã bỏ yêu thích");
        setIsFav(false);
        onToggleFavorite?.(product.id, true);
      } else {
        await axios.post(
          `http://localhost:5000/api/products/favorites/${product.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("❤️ Đã thêm vào yêu thích");
        setIsFav(true);
        onToggleFavorite?.(product.id, false);
      }
    } catch (err) {
      console.error("❌ Lỗi toggle favorite:", err);
      toast.error("Không thể thay đổi trạng thái yêu thích.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa sản phẩm");
      onDeleted?.(product.id);
    } catch (err) {
      console.error("❌ Lỗi xóa sản phẩm:", err);
      toast.error("Xóa thất bại");
    }
  };

  const handleSaved = (updated) => {
    onUpdated?.(updated);
  };

  return (
    <div className="relative bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      {!ownerView && (
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 z-10"
          disabled={loading}
        >
          <Heart
            className={`w-7 h-7 transition-transform duration-300 ${
              isFav ? "fill-pink-500 text-pink-500 scale-110" : "text-gray-400"
            }`}
          />
        </button>
      )}

      <Link to={`/products/${product.id}`} className="block">
        <img
          src={product.image_url || "https://via.placeholder.com/300"}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
      </Link>

      <div className="p-4 flex flex-col">
        <h2 className="font-semibold text-lg line-clamp-1">{product.name}</h2>
        <p className="text-orange-600 font-bold">{formatPrice(product.price)}</p>

        {ownerView && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpenEdit(true)}
              className="px-3 py-2 rounded bg-yellow-500 text-white"
            >
              Sửa
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 rounded bg-red-600 text-white"
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      <EditModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        product={product}
        onSaved={handleSaved}
      />
    </div>
  );
}
