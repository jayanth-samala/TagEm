export function cleanString(value, { min = 1, max = 255 } = {}) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length >= min && cleaned.length <= max ? cleaned : null;
}

export function isPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

export function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128 &&
    /[A-Za-z]/.test(password) && /\d/.test(password);
}
