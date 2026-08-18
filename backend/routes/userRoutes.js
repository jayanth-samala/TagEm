import express from "express";
import {getUsers} from "../controllers/userController.js"
import {getUserProfile} from "../controllers/userController.js"
import {deleteOwnAccount} from "../controllers/userController.js"

const router = express.Router();

router.get("/", getUsers);
router.delete("/account", deleteOwnAccount);
router.get("/Profile/:id", getUserProfile);

export default router;
