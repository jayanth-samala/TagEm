import express from "express";
import { removeResume, showProfile, updateProfile } from "../controllers/profileController.js";
import multer from "multer";
import { sendProfileFile } from "../controllers/profileController.js";
import { isResourceOwner } from "../utils/authorization.js";
import { rateLimit } from "../middleware/security.js";

const router = express.Router();
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: "profile-upload",
  keyGenerator: (req) => req.user?.id || req.ip,
});
const upload = multer({
  storage: multer.memoryStorage(),
  // Stay below Vercel Functions' 4.5 MB request limit, including multipart overhead.
  limits: { fileSize: 4 * 1024 * 1024, files: 2 },
  fileFilter(req, file, cb) {
    const allowed = file.fieldname === "image"
      ? new Set(["image/jpeg", "image/png", "image/webp"])
      : new Set(["application/pdf"]);
    cb(allowed.has(file.mimetype) ? null : new Error(`Unsupported ${file.fieldname} file type`), allowed.has(file.mimetype));
  },
});

function requireSelf(req, res, next) {
  if (!isResourceOwner(req.user, req.params.id)) {
    return res.status(403).json({ message: "You can only update your own profile" });
  }
  next();
}

async function verifyFileSignatures(req, res, next) {
  try {
    for (const [field, files] of Object.entries(req.files || {})) {
      for (const file of files) {
        const header = file.buffer.subarray(0, 12);

        const isPdf = header.subarray(0, 5).toString() === "%PDF-";
        const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
        const isPng = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
        const valid = field === "resume" ? isPdf : isJpeg || isPng || isWebp;

        if (!valid) {
          return res.status(400).json({ message: `Invalid ${field} file content` });
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

router.put("/:id", requireSelf, uploadRateLimit, upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]), verifyFileSignatures, updateProfile);
router.get("/:id/image", sendProfileFile("image"));
router.get("/:id/resume", sendProfileFile("resume"));
router.delete("/:id/resume", requireSelf, removeResume);
router.get("/:id", showProfile);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message?.startsWith("Unsupported")) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

export default router;
