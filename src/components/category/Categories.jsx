import React from "react";

const CATEGORIES = [
  { name: "Điện thoại", icon: "📱" },
  { name: "Laptop", icon: "💻" },
  { name: "Xe cộ", icon: "🚗" },
  { name: "Thời trang", icon: "👕" },
  { name: "Đồ gia dụng", icon: "🏠" },
  { name: "Thú cưng", icon: "🐶" },
];

export default function Categories() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 py-8">
      {CATEGORIES.map((cat, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center text-center hover:scale-105 transition"
        >
          <div className="w-16 h-16 flex items-center justify-center bg-orange-100 text-2xl rounded-full">
            {cat.icon}
          </div>
          <p className="mt-2 text-sm font-medium">{cat.name}</p>
        </div>
      ))}
    </div>
  );
}
