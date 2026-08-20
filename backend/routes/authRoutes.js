import express from "express";
import {createUser} from "../controllers/authController.js"
import passport from "../config/passport.js"

const router = express.Router();

router.post("/signup", createUser);
router.post("/login", passport.authenticate("local", {session: false}), (req,res)=>{
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        is_admin: req.user.is_admin
    });
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), (req, res) => {
    const userData = JSON.stringify({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        is_admin: req.user.is_admin,
        profilePicUrl: req.user.profilePicUrl
    });
    res.redirect(`http://localhost:5173/login?user=${encodeURIComponent(userData)}`);
});
export default router;