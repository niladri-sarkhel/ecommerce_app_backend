// scripts/seed/transformers/parsers/helpers.js

/**
 * Converts "Yes"/"No" to boolean.
 */
export function parseBoolean(value) {
  if (!value) return false;

  const normalized = value.toString().trim().toLowerCase();

  return ["yes", "true", "supported"].includes(normalized);
}

/**
 * Returns the first number found in a string.
 *
 * "3400 mAh" -> 3400
 * "7.0 inches" -> 7
 */
export function parseNumber(value) {
  if (!value) return null;

  const match = value.toString().match(/-?\d+(\.\d+)?/);

  return match ? Number(match[0]) : null;
}

/**
 * Returns all numbers found in a string.
 *
 * "16/32 GB" -> [16, 32]
 */
export function parseNumbers(value) {
  if (!value) return [];

  const matches = value.toString().match(/-?\d+(\.\d+)?/g);

  return matches ? matches.map(Number) : [];
}

/**
 * Splits pipe-separated values.
 *
 * "A|B|C"
 */
export function splitPipe(value) {
  if (!value) return [];

  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Splits slash-separated values.
 *
 * "16/32/64"
 */
export function splitSlash(value) {
  if (!value) return [];

  return value
    .split("/")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Converts RAM/storage strings to MB.
 *
 * "512 MB" -> 512
 * "2 GB" -> 2048
 * "1 TB" -> 1048576
 */
export function toMb(value) {
  if (!value) return null;

  const match = value.match(/(\d+(?:\.\d+)?)\s*(MB|GB|TB)/i);

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case "MB":
      return Math.round(amount);

    case "GB":
      return Math.round(amount * 1024);

    case "TB":
      return Math.round(amount * 1024 * 1024);

    default:
      return null;
  }
}

/**
 * Extracts every storage option from a string.
 *
 * "16/32 GB"
 * "64 GB"
 * "32/64/128 GB"
 */
export function parseStorageOptions(value) {
  if (!value) return [];

  const unit = value.match(/(MB|GB|TB)/i)?.[1]?.toUpperCase() ?? "GB";

  const numbers = parseNumbers(value);

  return numbers.map((n) => {
    switch (unit) {
      case "MB":
        return n;

      case "GB":
        return n * 1024;

      case "TB":
        return n * 1024 * 1024;

      default:
        return n;
    }
  });
}

/**
 * Removes duplicate values.
 */
export function unique(array) {
  return [...new Set(array)];
}

/**
 * Cleans whitespace.
 */
export function clean(value) {
  if (!value) return "";

  return value.toString().replace(/\s+/g, " ").trim();
}

/**
 * Checks if a value exists.
 */
export function exists(value) {
  return value !== undefined && value !== null && clean(value) !== "";
}
