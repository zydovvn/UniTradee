// backend/routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

// ⬇️ nếu bạn đã có middleware upload riêng thì giữ nguyên import này
// (middleware này cần cấu hình lưu file vào: uploads/avatars)
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ===================== PROFILE ===================== */

// GET /api/users/profile  (lấy profile user hiện tại)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, name, email, phone, school, student_id, address, age, role, avatar_url
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("❌ Lỗi get profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/update-profile
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const {
      name = null,
      phone = null,
      school = null,
      student_id = null,
      studentId = null,
      address = null,
      age = null,
    } = req.body;

    const studentIdValue = student_id ?? studentId ?? null;

    const result = await pool.query(
      `UPDATE users 
       SET name=$1, phone=$2, school=$3, student_id=$4, address=$5, age=$6
       WHERE id=$7
       RETURNING id, username, name, email, phone, school, student_id, address, age, role, avatar_url`,
      [name, phone, school, studentIdValue, address, age, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("❌ Lỗi update profile:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/change-password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu oldPassword hoặc newPassword" });
    }

    const userRes = await pool.query(
      `SELECT password FROM users WHERE id=$1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    const isMatch = await bcrypt.compare(oldPassword, userRes.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Mật khẩu cũ không đúng" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password=$1 WHERE id=$2`, [
      hashed,
      req.user.id,
    ]);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("❌ Lỗi change password:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===================== ADMIN ===================== */

// PUT /api/users/role/:userId  (admin only)
router.put("/role/:userId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { role } = req.body; // buyer | seller | admin
    await pool.query(`UPDATE users SET role=$1 WHERE id=$2`, [role, req.params.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("❌ update role:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/admin/users?query=&page=1&limit=10
router.get("/admin/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { query = "", page = 1, limit = 10 } = req.query;
    const q = `%${query.trim().toLowerCase()}%`;
    const lim = Math.max(1, Math.min(Number(limit) || 10, 50));
    const offset = (Math.max(1, Number(page) || 1) - 1) * lim;

    const where =
      query.trim().length > 0
        ? `WHERE LOWER(username) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(phone) LIKE $1`
        : "";

    const listSql = `
      SELECT id, username, email, phone, school, student_id, address, age, role, created_at,
             COALESCE(active, true) AS active
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM users
      ${where}
    `;

    const params = query.trim().length > 0 ? [q, lim, offset] : [lim, offset];
    const countParams = query.trim().length > 0 ? [q] : [];

    const [listRes, countRes] = await Promise.all([
      pool.query(listSql, params),
      pool.query(countSql, countParams),
    ]);

    res.json({
      items: listRes.rows,
      total: countRes.rows[0].total,
      page: Number(page) || 1,
      limit: lim,
    });
  } catch (e) {
    console.error("❌ admin list users:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/admin/users/:id/role
router.put("/admin/users/:id/role", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { role } = req.body;
    const allow = new Set(["buyer", "seller", "admin"]);
    if (!allow.has((role || "").toLowerCase())) {
      return res.status(400).json({ error: "Role không hợp lệ" });
    }
    const up = await pool.query(
      `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, email, role`,
      [role.toLowerCase(), req.params.id]
    );
    if (up.rows.length === 0) return res.status(404).json({ error: "User không tồn tại" });
    res.json({ ok: true, user: up.rows[0] });
  } catch (e) {
    console.error("❌ admin update role:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/users/admin/users/:id/active
router.put("/admin/users/:id/active", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { active } = req.body;
    const up = await pool.query(
      `UPDATE users SET active = $1 WHERE id=$2 RETURNING id, email, COALESCE(active,true) AS active`,
      [Boolean(active), req.params.id]
    );
    if (up.rows.length === 0) return res.status(404).json({ error: "User không tồn tại" });
    res.json({ ok: true, user: up.rows[0] });
  } catch (e) {
    console.error("❌ admin update active:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============== PUBLIC SELLER INFO (ProductDetail dùng) ============== */

// GET /api/users/:id/public
router.get("/:id/public", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(
      `SELECT u.id, u.username, u.name, u.phone, u.address, u.avatar_url,
              u.last_seen_at, u.response_avg_minutes, u.response_rate, u.role,
              COALESCE(v.total_sold, 0) as total_sold,
              COALESCE(v.rating_avg_overall, 0) as seller_rating_avg,
              COALESCE(v.rating_count_overall, 0) as seller_rating_count
       FROM users u
       LEFT JOIN v_seller_stats v ON v.seller_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    if (!q.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(q.rows[0]);
  } catch (e) {
    console.error("public seller error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===================== UPLOAD AVATAR ===================== */
/**
 * PUT /api/users/avatar
 * Body: FormData("avatar" = file)
 * Yêu cầu: middleware `upload.single("avatar")` lưu file vào uploads/avatars
 * Ghi vào DB cột avatar_url dạng 'uploads/avatars/xxx.jpg'
 */
router.put("/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Thiếu file 'avatar'" });

    // Lưu đường dẫn tương đối để FE build URL: http://localhost:5000/<relative>
    const relativePath = req.file.path.replace(/\\/g, "/"); // e.g. "uploads/avatars/u1_...jpg"

    await pool.query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [
      relativePath,
      req.user.id,
    ]);

    const result = await pool.query(
      `SELECT id, username, name, email, phone, school, student_id, address, age, role, avatar_url
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ message: "OK", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Upload avatar:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
