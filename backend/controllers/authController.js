import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../models/db.js"; // ✅ Kết nối DB
import dotenv from "dotenv";

dotenv.config();

// -------------------- LOGIN --------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  console.log("🟡 Email:", email);
  console.log("🟡 Password:", password);

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userRes.rows.length === 0) {
      console.log("🔴 Email không tồn tại trong hệ thống");
      return res.status(400).json({ error: "Email không tồn tại" });
    }

    const user = userRes.rows[0];

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("🔴 Sai mật khẩu");
      return res.status(400).json({ error: "Sai mật khẩu" });
    }

    // Tạo JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("🟢 Đăng nhập thành công");
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi hệ thống khi đăng nhập:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// -------------------- REGISTER --------------------
export const register = async (req, res) => {
  console.log("📥 Request body nhận được:", req.body); // debug

  const { email, password, username, phone } = req.body;

  // Kiểm tra field nào bị thiếu
  if (!email || !password || !username || !phone) {
    return res.status(400).json({ error: "Thiếu thông tin đăng ký" });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length > 0) {
      console.log("🔴 Email đã tồn tại");
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Thêm user mới vào DB
    const newUser = await pool.query(
      "INSERT INTO users (email, password, username, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, username, phone",
      [email, hashedPassword, username, phone]
    );

    // Tạo JWT token ngay sau khi đăng ký
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("🟢 Đăng ký thành công:", newUser.rows[0]);
    return res.status(201).json({
      token,
      user: newUser.rows[0],
    });
  } catch (err) {
console.error("❌ Lỗi hệ thống khi đăng ký:", err);
return res.status(500).json({ error: err.message });

  }
};