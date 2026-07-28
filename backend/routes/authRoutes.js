import express from "express";
import {createUser} from "../controllers/authController.js"
import passport from "../config/passport.js"
import { createToken } from "../utils/createToken.js";
import { authenticateToken } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies.js";

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", passport.authenticate("local", {session: false}), (req,res)=>{
    setAuthCookies(res, createToken(req.user));
    res.json({
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            is_admin: req.user.is_admin,
            profilePicUrl: req.user.profilePicUrl
        }
    });
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), (req, res) => {
    setAuthCookies(res, createToken(req.user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?oauth=success`);
});

router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

router.post("/logout", authenticateToken, csrfProtection, (req, res) => {
    clearAuthCookies(res);
    res.json({ message: "Logged out" });
});
export default router;
