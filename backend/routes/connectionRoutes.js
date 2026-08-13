import express from "express";
import {getUsers, sendRequest, getRequests, getConnectionStatus, acceptRequest, rejectRequest, getConnections} from "../controllers/connectionsController.js";
import { rateLimit } from "../middleware/security.js";

const router = express.Router();
const connectionMutationLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyPrefix: "connection-mutation",
  keyGenerator: (req) => req.user?.id || req.ip,
});

router.get("/users", getUsers);
router.post("/request", connectionMutationLimit, sendRequest);
router.get("/requests/:id", getRequests);
router.put("/accept/:id", connectionMutationLimit, acceptRequest);
router.delete("/reject/:id", connectionMutationLimit, rejectRequest);
router.get("/status/:senderId/:receiverId", getConnectionStatus);
router.get("/:id", getConnections);

export default router;
