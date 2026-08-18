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

export function cleanPositiveIntegerArray(value, { max = 100 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max) return null;

  const cleaned = [];
  const seen = new Set();
  for (const item of value) {
    const number = Number(item);
    if (!Number.isInteger(number) || number <= 0) return null;
    if (!seen.has(number)) {
      seen.add(number);
      cleaned.push(number);
    }
  }
  return cleaned;
}

export function cleanStringArray(value, { maxItems = 50, maxLength = 255 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems) return null;

  const cleaned = [];
  const seen = new Set();
  for (const item of value) {
    const string = cleanString(item, { max: maxLength });
    if (!string) return null;
    if (!seen.has(string)) {
      seen.add(string);
      cleaned.push(string);
    }
  }
  return cleaned;
}

export function parseOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === "") return null;
  return isPositiveInteger(value) ? Number(value) : undefined;
}
