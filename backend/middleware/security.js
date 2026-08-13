import crypto from "crypto";

const buckets = new Map();

export function requestLogger(req, res, next) {
  const requestId = req.get("X-Request-ID") || crypto.randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.set("X-Request-ID", requestId);
  res.on("finish", () => {
    console.log(JSON.stringify({
      level: "info",
      type: "request",
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
}

export function securityHeaders(req, res, next) {
  res.set({
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  next();
}

export function rateLimit({ windowMs, max, keyPrefix }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }
    next();
  };
}

export function errorHandler(error, req, res, next) {
  console.error(JSON.stringify({
    level: "error",
    type: "request_error",
    requestId: req.requestId,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  }));
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({
    message: error.status && error.status < 500 ? error.message : "Internal server error",
    requestId: req.requestId,
  });
}
