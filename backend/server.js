// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";   // nếu có
import { registerChatNamespace } from "./socket.js";      // nếu có

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// __dirname cho ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ====== Đảm bảo thư mục uploads tồn tại ====== */
const uploadDir = path.join(__dirname, "uploads");
const avatarDir = path.join(uploadDir, "avatars");
const reviewDir = path.join(uploadDir, "reviews");
[uploadDir, avatarDir, reviewDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

/* ====== Public static cho ảnh ====== */
// Giúp FE truy cập ảnh: http://localhost:5000/uploads/avatars/<file>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =================== Routes =================== */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes); // nếu có

/* ================= Socket.IO ================== */
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", credentials: true } });
registerChatNamespace(io); // nếu có

// cho phép controller lấy io
app.set("io", io);

// kênh product realtime
io.on("connection", (socket) => {
  socket.on("product:join", ({ productId }) => {
    if (productId) socket.join(`product:${productId}`);
  });
  socket.on("product:leave", ({ productId }) => {
    if (productId) socket.leave(`product:${productId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

