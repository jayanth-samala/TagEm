import express from "express";
import {createPosts, deleteReply, getPosts, getPostsById,getPostsByUserId,likePost, /*updatePost*/ /*deletePost*/} from "../controllers/postsController.js";
import multer from "multer";
import { rateLimit } from "../middleware/security.js";

const router = express.Router();
const postMutationLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  keyPrefix: "post-mutation",
  keyGenerator: (req) => req.user?.id || req.ip,
});
//const upload = multer({ dest: "uploads/" });

//router.post("/", upload.single("image"), createPost);
router.post("/", postMutationLimit, createPosts);
router.get("/", getPosts);
router.get("/user/:userId", getPostsByUserId);
router.get("/:id", getPostsById);
router.put("/:id/like", postMutationLimit, likePost)
router.delete("/replies/:id", postMutationLimit, deleteReply);
//router.put("/:id", upload.single("image"), updatePost);
//router.delete("/:id", deletePost);

export default router;
