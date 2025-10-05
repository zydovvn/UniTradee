import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("❌ Lỗi khi load chi tiết sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleOrder = async () => {
    if (!user) {
      toast.error("⚠️ Vui lòng đăng nhập để tạo yêu cầu mua.");
      return;
    }
    if (!product) return;

    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      toast.error("Số lượng không hợp lệ.");
      return;
    }

    // Không cho tự đặt hàng
    if (product.seller_id && user.id && Number(product.seller_id) === Number(user.id)) {
      toast("Bạn không thể mua sản phẩm của chính mình.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/orders",
        { product_id: product.id, quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("🎉 Đã tạo yêu cầu mua!");
      navigate("/orders/buyer");
    } catch (err) {
      console.error("❌ Lỗi khi tạo đơn:", err);
      toast.error("Không thể tạo yêu cầu mua.");
    }
  };

  if (loading) return <p className="text-center py-10">Đang tải...</p>;
  if (!product) return <p className="text-center py-10">Không tìm thấy sản phẩm.</p>;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex justify-center">
          <img
            src={product.image_url || "https://via.placeholder.com/500"}
            alt={product.name}
            className="rounded-lg shadow-lg max-h-[500px] object-cover"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-orange-600 text-2xl font-semibold mb-6">
            {new Intl.NumberFormat("vi-VN").format(product.price)} đ
          </p>
          <p className="text-gray-700 mb-6">{product.description}</p>

          <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
            <h2 className="font-semibold text-lg mb-2">Thông tin người bán</h2>
            <p><span className="font-medium">Tên:</span> {product.seller_name}</p>
            {product.seller_phone && (
              <p><span className="font-medium">SĐT:</span> {product.seller_phone}</p>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {product.seller_phone && (
              <a
                href={`tel:${product.seller_phone}`}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                📞 Gọi ngay
              </a>
            )}

            <button
              className="bg-yellow-400 text-white px-6 py-2 rounded-lg hover:bg-yellow-500 transition"
              onClick={() =>
                navigate("/messages", {
                  state: {
                    sellerId: product.seller_id,   // cần backend trả seller_id
                    sellerName: product.seller_name,
                  },
                })
              }
            >
              💬 Nhắn tin
            </button>

            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 border rounded px-2 py-1"
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleOrder}
              >
                📝 Tạo yêu cầu mua
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
