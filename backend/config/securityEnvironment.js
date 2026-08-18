const PLACEHOLDER_SECRETS = new Set([
  "replace-with-at-least-32-random-bytes",
  "changeme",
  "secret",
]);

export function validateJwtSecret(secret, { production = process.env.NODE_ENV === "production" } = {}) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("JWT_SECRET is required");
  }
  if (production && (Buffer.byteLength(secret, "utf8") < 32 || PLACEHOLDER_SECRETS.has(secret.toLowerCase()))) {
    throw new Error("JWT_SECRET must contain at least 32 random bytes in production");
  }
  return secret;
}

export function getJwtSecret() {
  return validateJwtSecret(process.env.JWT_SECRET);
}
