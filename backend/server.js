import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import Router from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import connectionRouter from "./routes/connectionRoutes.js";
import profileRouter from "./routes/profileRouter.js";
import postsRouter from "./routes/postsRouter.js";
import meetupsRouter from "./routes/meetupsRoutes.js";
import passport from "passport";
import adminRoutes from "./routes/adminRoutes.js";
import jobsRouter from "./routes/jobsRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/users", Router);
app.use("/api/auth", authRouter);
app.use("/api/getUsers", connectionRouter);
app.use("/api/Profile", profileRouter);
app.use("/uploads", express.static("uploads"));
app.use("/api/connections", connectionRouter);
app.use("/api/posts", postsRouter);
app.use("/api/meetups", meetupsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobsRouter);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});