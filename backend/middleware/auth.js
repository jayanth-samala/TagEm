import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { AUTH_COOKIE_NAME, parseCookies } from "../utils/authCookies.js";
import { getJwtSecret } from "../config/securityEnvironment.js";

export async function authenticateToken(req, res, next) {
  const token = parseCookies(req)[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const result = await pool.query(
      `SELECT id, name, email, is_admin, "profilePicUrl", auth_token_version
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (decoded.tokenVersion !== result.rows[0].auth_token_version) {
      return res.status(401).json({ message: "Authentication token revoked" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired" });
    }

    return res.status(401).json({ message: "Invalid authentication token" });
  }
}
