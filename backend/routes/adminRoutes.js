import express from "express";
import { getAllUsers, updateUser, changeUserPassword, deleteUser } from "../controllers/adminController.js";
import { adminAuth } from "../middleware/adminAuth.js"

const router = express.Router();

router.use(adminAuth);

router.get("/users", getAllUsers);
router.put("/users/:userId", updateUser);
router.put("/users/:userId/password", changeUserPassword);
router.delete("/users/:userId", deleteUser);

export default router;
