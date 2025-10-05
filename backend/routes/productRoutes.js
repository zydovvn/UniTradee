import express from "express";
import multer from "multer";
import path from "path";
import pool from "../models/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { diskUploader } from "../utils/uploader.js";
const router = express.Router();

// Multer cấu hình lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// -------------------------------
// Tạo sản phẩm mới
// -------------------------------
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, category_id } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

    if (!name || !price || !description || !category_id) {
      return res.status(400).json({ error: "Thiếu thông tin sản phẩm" });
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, description, image_url, user_id, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, price, description, imageFilename, req.user.id, category_id]
    );
    const row = result.rows[0];

    const product = {
      ...row,
      image_url: row.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${row.image_url}`
        : null,
    };

    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Lỗi khi tạo sản phẩm:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Đếm số tin đã đăng của user
router.get("/myposts/count", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM products
       WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ count: r.rows[0].count || 0 });
  } catch (err) {
    console.error("❌ Lỗi khi đếm myposts:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Lấy tất cả categories
// -------------------------------
router.get("/categories/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, slug FROM categories ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy categories:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Lấy danh sách sản phẩm đã đăng bởi user
// -------------------------------
router.get("/myposts", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    const products = result.rows.map((p) => ({
      ...p,
      image_url: p.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${p.image_url}`
        : null,
    }));
    res.json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy myposts:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Lấy danh sách sản phẩm yêu thích
// -------------------------------
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              u.username AS seller_name, u.phone AS seller_phone
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.user_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    const products = result.rows.map((p) => ({
      ...p,
      image_url: p.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${p.image_url}`
        : null,
    }));
    res.json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy favorites:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Thêm vào sản phẩm yêu thích
router.post("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi thêm favorite:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Xóa sản phẩm yêu thích
router.delete("/favorites/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
      [req.user.id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xóa favorite:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// CẬP NHẬT sản phẩm (SỬA)  🆕
// Hỗ trợ: body JSON hoặc multipart (image optional)
// Chỉ cho phép chủ sở hữu
// -------------------------------
router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;

    // Check quyền sở hữu
    const check = await pool.query(
      "SELECT id, user_id, image_url FROM products WHERE id = $1",
      [productId]
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Bạn không có quyền sửa sản phẩm này" });
    }

    const { name, price, description, category_id } = req.body;
    // Nếu có upload ảnh mới
    const newImageFilename = req.file ? req.file.filename : null;

    // Cập nhật dùng COALESCE để giữ nguyên khi field trống/undefined
    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           category_id = COALESCE($5, category_id)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name ?? null, price ?? null, description ?? null, newImageFilename ?? null, category_id ?? null, productId, userId]
    );

    const row = result.rows[0];
    const updated = {
      ...row,
      image_url: row.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${row.image_url}`
        : null,
    };
    res.json(updated);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật sản phẩm:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// Lấy tất cả sản phẩm (có lọc theo category)
// -------------------------------
// Lấy danh sách tất cả sản phẩm (lọc theo category slug và/hoặc từ khóa q)
router.get("/", async (req, res) => {
  try {
    const { category, q, limit } = req.query;

    const params = [];
    let where = [];
    let i = 1;

    let query = `
      SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
             c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
             u.username AS seller_name, u.phone AS seller_phone
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.user_id = u.id
    `;

    if (category) {
      where.push(`c.slug = $${i++}`);
      params.push(category);
    }
    if (q) {
      // tìm theo tên (không phân biệt hoa thường)
      where.push(`p.name ILIKE $${i++}`);
      params.push(`%${q}%`);
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")} `;
    }
    query += " ORDER BY p.created_at DESC ";

    // nếu là autocomplete, FE sẽ gửi limit=8 chẳng hạn
    if (limit && Number(limit) > 0) {
      query += ` LIMIT ${Number(limit)} `;
    }

    const result = await pool.query(query, params);
    const products = result.rows.map((p) => ({
      ...p,
      image_url: p.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${p.image_url}`
        : null,
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Lỗi khi lấy sản phẩm:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// -------------------------------
// Lấy chi tiết sản phẩm theo id
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.price, p.description, p.image_url, p.created_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              u.id AS seller_id,                -- 🆕 cần cho ProductDetail (chat & chặn tự mua)
              u.username AS seller_name, 
              u.phone AS seller_phone
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    const row = result.rows[0];
    const product = {
      ...row,
      image_url: row.image_url
        ? `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${row.image_url}`
        : null,
    };
    res.json(product);
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết sản phẩm:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------
// XÓA sản phẩm (chỉ chủ sở hữu)
// -------------------------------
// Xóa sản phẩm (có transaction + dọn file ảnh)
router.delete("/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    await client.query("BEGIN");

    // Lấy filename ảnh & kiểm tra quyền sở hữu
    const pre = await client.query(
      `SELECT image_url FROM products WHERE id = $1 AND user_id = $2`,
      [productId, userId]
    );
    if (pre.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm hoặc không có quyền" });
    }

    // (Không bắt buộc nếu đã sửa FK) dọn các bảng phụ để an toàn idempotent
    await client.query(`DELETE FROM order_items WHERE product_id = $1`, [productId]);
    await client.query(`DELETE FROM favorites WHERE product_id = $1`, [productId]);
    // orders có ON DELETE CASCADE nên không cần xóa tay

    // Xóa sản phẩm
    const del = await client.query(
      `DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING image_url`,
      [productId, userId]
    );

    await client.query("COMMIT");

    // gỡ file ảnh trên đĩa nếu có
    const filename = del.rows[0]?.image_url;
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads", filename);
      import("fs").then(({ unlink }) => {
        unlink(filePath, () => {}); // bỏ qua lỗi nếu file không tồn tại
      });
    }

    return res.json({ message: "Đã xóa thành công" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi khi xóa sản phẩm:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    client.release();
  }
});



// backend/routes/productRoutes.js
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  const results = await pool.query(
    "SELECT id, title, image FROM products WHERE LOWER(title) LIKE $1 LIMIT 10",
    [`%${q.toLowerCase()}%`]
  );
  res.json(results.rows);
});

// 🔵 Chi tiết sản phẩm (mở rộng dữ liệu)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const q = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url,
              p.user_id as seller_id, p.stock, p.is_available,
              p.sold_count, p.rating_avg, p.rating_count, p.updated_at,
              u.username as seller_name, u.phone as seller_phone, u.avatar_url as seller_avatar_url,
              u.last_seen_at, u.response_avg_minutes, u.response_rate,
              COALESCE(v.total_sold,0) as seller_total_sold,
              COALESCE(v.rating_avg_overall,0) as seller_rating_avg,
              COALESCE(v.rating_count_overall,0) as seller_rating_count
       FROM products p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN v_seller_stats v ON v.seller_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (!q.rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(q.rows[0]);
  } catch (e) {
    console.error("product detail error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

/* ----------------- REVIEWS ----------------- */

const reviewUpload = diskUploader("reviews");

// GET reviews list
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `SELECT pr.id, pr.rating, pr.content, pr.images, pr.created_at,
              u.username, u.avatar_url
       FROM product_reviews pr
       LEFT JOIN users u ON u.id = pr.user_id
       WHERE pr.product_id = $1
       ORDER BY pr.created_at DESC
       LIMIT 100`,
      [id]
    );
    res.json(r.rows);
  } catch (e) {
    console.error("reviews list error:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});

// POST review (+ ảnh)
// routes/productRoutes.js (phần reviews)
router.post("/:id/reviews", authMiddleware, reviewUpload.array("images", 6), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = req.user.id;
    const { rating, content } = req.body;

    // lưu review + ảnh (bỏ qua chi tiết)
    // ...

    // cập nhật lại rating_avg / rating_count
    const agg = await pool.query(
      `SELECT AVG(rating)::numeric(10,2) AS avg, COUNT(*)::int AS count
       FROM product_reviews WHERE product_id = $1`,
      [productId]
    );
    const rating_avg = Number(agg.rows[0].avg || 0);
    const rating_count = Number(agg.rows[0].count || 0);
    await pool.query(
      `UPDATE products SET rating_avg=$1, rating_count=$2, updated_at=NOW()
       WHERE id=$3`,
      [rating_avg, rating_count, productId]
    );

    // emit realtime tới phòng product
    const io = req.app.get("io");
    io?.to(`product:${productId}`).emit("review:created", {
      product_id: productId,
      rating_avg,
      rating_count,
      // có thể gửi review mới nếu muốn FE prepend
      // review: { id, username, avatar_url, rating, content, images, created_at }
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("create review:", e.message);
    res.status(500).json({ error: "Server error" });
  }
});



export default router;
