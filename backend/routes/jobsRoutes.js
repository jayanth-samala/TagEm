import express from "express";

import { getJobsForUser, getJobsSentByUser, createJob, getJobSendOptions, setConnectionTag, deleteConnectionTag, deleteJob } from "../controllers/jobsController.js";
import { rateLimit } from "../middleware/security.js";

const router = express.Router();
const jobMutationLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "job-mutation",
  keyGenerator: (req) => req.user?.id || req.ip,
});
router.get("/options/:userId", getJobSendOptions);
router.get("/jobsSentByUser/:userId", getJobsSentByUser);
router.get("/:userId", getJobsForUser);
router.post("/", jobMutationLimit, createJob);
router.post("/connection-tags", jobMutationLimit, setConnectionTag);
router.delete("/connection-tags/:ownerId/:connectionUserId/:tagType", jobMutationLimit, deleteConnectionTag);
router.delete("/:jobId", jobMutationLimit, deleteJob);

export default router;
