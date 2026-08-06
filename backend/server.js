import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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
import { authenticateToken } from "./middleware/auth.js";
import { csrfProtection } from "./middleware/csrf.js";
import { securityHeaders } from "./middleware/security.js";

dotenv.config();

const app = express();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "uploads");

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(passport.initialize());

app.use("/api/auth", authRouter);
app.use("/api", authenticateToken);
app.use("/api", csrfProtection);
app.use("/api/users", Router);
app.use("/api/getUsers", connectionRouter);
app.use("/api/Profile", profileRouter);
app.get("/uploads/:filename", authenticateToken, async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename !== req.params.filename) return res.status(400).json({ message: "Invalid filename" });

  try {
    const suffix = `/${filename}`;
    const result = await pool.query(
      `SELECT id,
              RIGHT(COALESCE("profilePicUrl", ''), LENGTH($1)) = $1 AS is_profile_picture,
              RIGHT(COALESCE(resumeattached, ''), LENGTH($1)) = $1 AS is_resume
       FROM users
       WHERE RIGHT(COALESCE("profilePicUrl", ''), LENGTH($1)) = $1
          OR RIGHT(COALESCE(resumeattached, ''), LENGTH($1)) = $1`,
      [suffix]
    );
    const record = result.rows[0];
    if (!record || (record.is_resume && record.id !== req.user.id && !req.user.is_admin)) {
      return res.status(404).json({ message: "File not found" });
    }
    res.sendFile(filename, { root: uploadsDirectory, dotfiles: "deny" });
  } catch (error) {
    console.error("File access error:", error);
    res.status(500).json({ message: "Unable to retrieve file" });
  }
});
app.use("/api/connections", connectionRouter);
app.use("/api/posts", postsRouter);
app.use("/api/meetups", meetupsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobsRouter);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
