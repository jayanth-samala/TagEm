import crypto from "crypto";
import { CSRF_COOKIE_NAME, parseCookies } from "../utils/authCookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function tokensMatch(cookieToken, headerToken) {
  if (!cookieToken || !headerToken) return false;

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  return (
    cookieBuffer.length === headerBuffer.length &&
    crypto.timingSafeEqual(cookieBuffer, headerBuffer)
  );
}

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = parseCookies(req)[CSRF_COOKIE_NAME];
  const headerToken = req.get("X-CSRF-Token");

  if (!tokensMatch(cookieToken, headerToken)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
}
