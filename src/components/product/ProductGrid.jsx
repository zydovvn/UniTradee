// src/components/product/ProductGrid.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products: productsProp, setProducts: setProductsProp }) {
  const location = useLocation();
  const [loading, setLoading] = useState(!productsProp);
  const [productsInternal, setProductsInternal] = useState([]);

  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  const category = params.get("category") || "";

  const products = useMemo(
    () => (productsProp ? productsProp : productsInternal),
    [productsProp, productsInternal]
  );
  const setProducts = setProductsProp || setProductsInternal;

  useEffect(() => {
    if (productsProp) return; // parent quản lý
    setLoading(true);
    axios
      .get("http://localhost:5000/api/products", {
        params: { q: q || undefined, category: category || undefined },
      })
      .then((res) => setProductsInternal(res.data || []))
      .catch(() => setProductsInternal([]))
      .finally(() => setLoading(false));
  }, [q, category, productsProp]);

  if (loading) return <p className="text-center py-10">Đang tải...</p>;
  if (!products || products.length === 0) {
    return <p className="text-center py-10">Không có sản phẩm nào.</p>;
  }

  const handleToggleFavorite = (productId, isFavorite) => {
    if (!setProducts) return;
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, isFavorite: !isFavorite } : p)));
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {(q || category) && (
        <p className="text-sm text-gray-500 mb-4">
          Kết quả cho {q ? <b>“{q}”</b> : null}
          {q && category ? " · " : ""}
          {category ? <>Danh mục: <b>{category}</b></> : null}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
