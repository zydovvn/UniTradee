// backend/routes/authRoutes.js
import express from "express";
import pool from "../models/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟢 Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    const check = await pool.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, email, phone, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, username, email, phone, role`,
      [username, hashed, email, phone]
    );

    res.status(201).json({
      message: "Đăng ký thành công, vui lòng đăng nhập",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// 🟢 Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Sai email hoặc mật khẩu" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Sai email hoặc mật khẩu" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        school: user.school,
        student_id: user.student_id,
        address: user.address,
        age: user.age,
            role: user.role,             // nếu có cột role
    avatar_url: user.avatar_url, // ✅ thêm dòng này
      },
    });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/// 🟢 API lấy user hiện tại
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, phone, school, student_id, address, age, role
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi /me:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
