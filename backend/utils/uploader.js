import multer from "multer";
import path from "path";
import fs from "fs";

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

export function diskUploader(subdir = "") {
  const base = path.join(process.cwd(), "uploads", subdir);
  ensureDir(base);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, base),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });
  return multer({ storage });
}
