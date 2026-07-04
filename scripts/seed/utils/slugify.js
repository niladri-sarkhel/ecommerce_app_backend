export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

/**
 * Generates a consistent 13-digit numeric string based on a text input
 * to mimic a valid EAN-13 structure deterministically.
 */
export const generateDeterministicEan = (inputString) => {
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Force absolute value, pad out to 13 digits, slice to match standard EAN lengths
  const absoluteHash = Math.abs(hash).toString().padEnd(12, "0");
  return `200${absoluteHash.substring(0, 10)}`; // EANs starting with 2 belong to internal/custom catalog pools
};
