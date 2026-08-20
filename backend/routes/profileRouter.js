import express from "express";
import {updateProfile, showProfile} from "../controllers/profileController.js";
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
},
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.put("/:id", upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]), updateProfile);
router.get("/:id", showProfile);

export default router;
