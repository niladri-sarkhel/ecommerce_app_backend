import { extractNumber, safeSplitString } from "../../utils/parser.js";
import { parseMonthStr } from "../../utils/month.js";

export const parseCatalog = (raw, categoryMap) => {
  const categoryId = categoryMap["Smartphones"] || null; // Fallback mapping rule

  // Parse Announced: "2016  August"
  const announcedParts = safeSplitString(raw.announced, " ");
  const announcedYear = extractNumber(raw.announced, /(\d{4})/);
  const announcedMonth =
    announcedParts.length > 1 ? parseMonthStr(announcedParts[1]) : null;

  // Parse Status: "Available. Released 2016  October"
  const statusStr = (raw.status || "").toLowerCase();
  let status = "coming_soon";
  if (statusStr.includes("available")) status = "available";
  if (statusStr.includes("discontinued")) status = "discontinued";
  if (statusStr.includes("cancelled")) status = "cancelled";

  const releasedYear = extractNumber(raw.status, /released\s+(\d{4})/i);
  // Match word characters directly following the year
  const releasedMonthMatch = String(raw.status).match(
    /released\s+\d{4}\s+([A-Za-z]+)/i,
  );
  const releasedMonth = releasedMonthMatch
    ? parseMonthStr(releasedMonthMatch[1])
    : null;

  return {
    categoryId,
    release: {
      announced: { year: announcedYear, month: announcedMonth },
      released: releasedYear
        ? { year: releasedYear, month: releasedMonth }
        : null,
    },
    status,
  };
};
