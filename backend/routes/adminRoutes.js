import express from "express";

import { getAllUsers, updateUser, changeUserPassword, deleteUser, resetDatabase } from "../controllers/adminController.js";

const router = express.Router();

router.get("/users/:adminId", getAllUsers);
router.put("/users/:adminId/:userId", updateUser);
router.put("/users/:adminId/:userId/password", changeUserPassword);
router.delete("/users/:adminId/:userId", deleteUser);
router.post("/reset-database/:adminId", resetDatabase);

export default router;