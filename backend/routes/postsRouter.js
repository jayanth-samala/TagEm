import express from "express";
import {createPosts, getPosts, getPostsById,getPostsByUserId,likePost, /*updatePost*/ /*deletePost*/} from "../controllers/postsController.js";
import multer from "multer";

const router = express.Router();
//const upload = multer({ dest: "uploads/" });

//router.post("/", upload.single("image"), createPost);
router.post("/", createPosts);
router.get("/", getPosts);
router.get("/user/:userId", getPostsByUserId);
router.get("/:id", getPostsById);
router.put("/:id/like", likePost)
//router.put("/:id", upload.single("image"), updatePost);
//router.delete("/:id", deletePost);

export default router;