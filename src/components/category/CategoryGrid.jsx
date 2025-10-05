export default function CategoryGrid() {
  const categories = [
    "📚 Sách vở",
    "💻 Điện tử",
    "👕 Thời trang",
    "🏠 Nhà cửa",
    "🚗 Xe cộ",
    "🎮 Giải trí",
  ];

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-lg font-semibold mb-4">Khám phá danh mục</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="p-4 border rounded text-center bg-gradient-to-br from-white to-orange-50 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
