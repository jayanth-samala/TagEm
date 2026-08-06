import express from "express";
import {updateProfile, showProfile} from "../controllers/profileController.js";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const router = express.Router();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDirectory);
},
  filename: function (req, file, cb) {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter(req, file, cb) {
    const allowed = file.fieldname === "image"
      ? new Set(["image/jpeg", "image/png", "image/webp"])
      : new Set(["application/pdf"]);
    cb(allowed.has(file.mimetype) ? null : new Error(`Unsupported ${file.fieldname} file type`), allowed.has(file.mimetype));
  },
});

function requireSelf(req, res, next) {
  if (Number(req.params.id) !== req.user.id) {
    return res.status(403).json({ message: "You can only update your own profile" });
  }
  next();
}

async function verifyFileSignatures(req, res, next) {
  try {
    for (const [field, files] of Object.entries(req.files || {})) {
      for (const file of files) {
        const handle = await fs.open(file.path, "r");
        const header = Buffer.alloc(12);
        await handle.read(header, 0, header.length, 0);
        await handle.close();

        const isPdf = header.subarray(0, 5).toString() === "%PDF-";
        const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
        const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
        const valid = field === "resume" ? isPdf : isJpeg || isPng || isWebp;

        if (!valid) {
          await Promise.all(Object.values(req.files).flat().map((uploaded) => fs.unlink(uploaded.path).catch(() => {})));
          return res.status(400).json({ message: `Invalid ${field} file content` });
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

router.put("/:id", requireSelf, upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]), verifyFileSignatures, updateProfile);
router.get("/:id", showProfile);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message?.startsWith("Unsupported")) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

export default router;
