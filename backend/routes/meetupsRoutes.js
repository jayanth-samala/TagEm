import express from "express";
import { getMeetups, getMeetupById, getSuggestedMeetups, createMeetup, updateMeetup, deleteMeetup } from "../controllers/meetupsController.js";

const router = express.Router();

router.get("/", getMeetups);
router.get("/suggested/:location/:currentMeetupId", getSuggestedMeetups);
router.get("/:id", getMeetupById);
router.post("/", createMeetup);
router.put("/:id", updateMeetup);
router.delete("/:id", deleteMeetup);

export default router;