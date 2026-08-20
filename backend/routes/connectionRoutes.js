import express from "express";
import {getUsers, sendRequest, getRequests, getConnectionStatus, acceptRequest, rejectRequest, getConnections} from "../controllers/connectionsController.js";

const router = express.Router();

router.get("/users", getUsers);
router.post("/request", sendRequest);
router.get("/requests/:id", getRequests);
router.put("/accept/:id", acceptRequest);
router.delete("/reject/:id", rejectRequest);
router.get("/status/:senderId/:receiverId", getConnectionStatus);
router.get("/:id", getConnections);

export default router;
