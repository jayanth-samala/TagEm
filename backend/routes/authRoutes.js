import express from "express";
import crypto from "crypto";
import {createUser} from "../controllers/authController.js"
import passport from "../config/passport.js"
import { createToken } from "../utils/createToken.js";
import { authenticateToken } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import {
    clearAuthCookies,
    clearOAuthStateCookie,
    OAUTH_STATE_COOKIE_NAME,
    parseCookies,
    setAuthCookies,
    setOAuthStateCookie,
} from "../utils/authCookies.js";
import { rateLimit } from "../middleware/security.js";
import pool from "../config/db.js";

const router = express.Router();

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "auth" });

router.post("/signup", authRateLimit, createUser);
router.post("/login", authRateLimit, passport.authenticate("local", {session: false}), (req,res)=>{
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

router.get("/google", (req, res, next) => {
    const state = crypto.randomBytes(32).toString("hex");
    setOAuthStateCookie(res, state);
    passport.authenticate("google", { scope: ["profile", "email"], state })(req, res, next);
});

function validateOAuthState(req, res, next) {
    const expected = parseCookies(req)[OAUTH_STATE_COOKIE_NAME];
    const received = typeof req.query.state === "string" ? req.query.state : "";
    clearOAuthStateCookie(res);
    if (!expected || !received) return res.status(400).json({ message: "Invalid OAuth state" });
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
        return res.status(400).json({ message: "Invalid OAuth state" });
    }
    next();
}

router.get("/google/callback", validateOAuthState, passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?oauth=failed`,
}), (req, res) => {
    setAuthCookies(res, createToken(req.user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?oauth=success`);
});

router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

router.post("/logout", authenticateToken, csrfProtection, async (req, res) => {
    try {
        await pool.query("UPDATE users SET auth_token_version = auth_token_version + 1 WHERE id = $1", [req.user.id]);
        clearAuthCookies(res);
        res.json({ message: "Logged out" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Unable to log out" });
    }
});
export default router;
