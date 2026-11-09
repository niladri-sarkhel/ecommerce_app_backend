export const safeSplitString = (value, delimiter = ",") => {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(delimiter)
    .map((v) => v.trim())
    .filter(Boolean);
};

export const extractNumber = (text, regex) => {
  if (!text) return null;
  const match = String(text).match(regex);
  return match ? parseFloat(match[1]) : null;
};

export const cleanBoolean = (value) => {
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return str === "yes" || str === "true" || str === "1";
};
