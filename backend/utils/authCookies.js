import crypto from "crypto";

export const AUTH_COOKIE_NAME = "tagem_auth";
export const CSRF_COOKIE_NAME = "tagem_csrf";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function sameSite() {
  const configured = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  return new Set(["strict", "lax", "none"]).has(configured) ? configured : "lax";
}

function baseCookieOptions() {
  return {
    secure: isProduction() || sameSite() === "none",
    sameSite: sameSite(),
    path: "/",
  };
}

export function parseCookies(req) {
  const cookies = {};

  for (const part of (req.headers.cookie || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;

    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

export function setAuthCookies(res, token) {
  const maxAge = Number(process.env.JWT_COOKIE_MAX_AGE_MS || 60 * 60 * 1000);
  const csrfToken = crypto.randomBytes(32).toString("hex");

  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    httpOnly: true,
    maxAge,
  });
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    ...baseCookieOptions(),
    httpOnly: false,
    maxAge,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...baseCookieOptions(),
    httpOnly: true,
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    ...baseCookieOptions(),
    httpOnly: false,
  });
}
