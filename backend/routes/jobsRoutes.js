import express from "express";

import { getJobsForUser, getJobsSentByUser, createJob, getJobSendOptions, setConnectionTag, deleteConnectionTag, deleteJob } from "../controllers/jobsController.js";

const router = express.Router();
router.get("/options/:userId", getJobSendOptions);
router.get("/jobsSentByUser/:userId", getJobsSentByUser);
router.get("/:userId", getJobsForUser);
router.post("/", createJob);
router.post("/connection-tags", setConnectionTag);
router.delete("/connection-tags/:ownerId/:connectionUserId/:tagType", deleteConnectionTag);
router.delete("/:jobId", deleteJob);

export default router;
