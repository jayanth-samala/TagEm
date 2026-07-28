export async function adminAuth(req, res, next) {
    if (!req.user?.is_admin) {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
}
