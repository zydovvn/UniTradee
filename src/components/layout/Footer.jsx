import { Mail, Phone, Home } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        {/* Logo + About */}
        <div>
          <h2 className="text-2xl font-bold mb-4">UniTrade</h2>
          <p className="text-sm leading-relaxed opacity-90">
            Nền tảng trung gian kết nối người mua và người bán.  
            Đăng tin dễ dàng, tiếp cận hàng ngàn người dùng mỗi ngày.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Liên kết</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/" className="hover:underline hover:text-gray-100 transition">
                Trang chủ
              </a>
            </li>
            <li>
              <a href="/search" className="hover:underline hover:text-gray-100 transition">
                Tìm kiếm
              </a>
            </li>
            <li>
              <a href="/myposts" className="hover:underline hover:text-gray-100 transition">
                Tin đã đăng
              </a>
            </li>
            <li>
              <a href="/profile" className="hover:underline hover:text-gray-100 transition">
                Tài khoản
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Liên hệ</h3>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Mail size={16} /> <span>support@unitrade.vn</span>
          </div>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Phone size={16} /> <span>0123-456-789</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Home size={16} /> <span>Hà Nội, Việt Nam</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="bg-orange-600 text-center py-4 text-sm font-medium">
        © {new Date().getFullYear()} UniTrade. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
