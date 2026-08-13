import express from "express";
import { getMeetups, getMeetupById, getSuggestedMeetups, createMeetup, updateMeetup, deleteMeetup } from "../controllers/meetupsController.js";
import { rateLimit } from "../middleware/security.js";

const router = express.Router();
const meetupMutationLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  keyPrefix: "meetup-mutation",
  keyGenerator: (req) => req.user?.id || req.ip,
});

router.get("/", getMeetups);
router.get("/suggested/:location/:currentMeetupId", getSuggestedMeetups);
router.get("/:id", getMeetupById);
router.post("/", meetupMutationLimit, createMeetup);
router.put("/:id", meetupMutationLimit, updateMeetup);
router.delete("/:id", meetupMutationLimit, deleteMeetup);

export default router;
