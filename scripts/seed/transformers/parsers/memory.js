import { extractNumber, safeSplitString } from "../../utils/parser.js";

export const parseMemorySpec = (raw) => {
  const ramStr = raw.RAM || "";
  const cardStr = raw.memory_card || "";

  // Force raw.internal_memory to be a safe string primitive
  const internalStr =
    raw.internal_memory !== undefined && raw.internal_memory !== null
      ? String(raw.internal_memory).trim()
      : "";

  // Standardize RAM values cleanly
  let ramMb = extractNumber(ramStr, /^([\d.]+)\s*GB/i) * 1024;
  if (!ramMb) ramMb = extractNumber(ramStr, /^([\d.]+)\s*MB/i);

  // Check if the entire string implies GB or MB sizing safely now
  const isGb = internalStr.toUpperCase().includes("GB");
  const isMb = internalStr.toUpperCase().includes("MB");

  const storageOptionsMb = safeSplitString(internalStr, "/")
    .map((opt) => {
      let num = parseInt(opt, 10);
      if (isNaN(num)) return null;

      // Apply unit rules cleanly based on string components
      if (
        opt.toUpperCase().includes("GB") ||
        (!opt.toUpperCase().includes("MB") && isGb)
      ) {
        return num * 1024;
      }
      return num;
    })
    .filter(Boolean);

  const maxGb = extractNumber(cardStr, /up\s+to\s+(\d+)\s+GB/i);

  return {
    ramMb,
    storageOptionsMb,
    expandable: {
      supported: cardStr.toLowerCase().startsWith("microsd"),
      type: cardStr.includes("microSD") ? "microSD" : null,
      maxMb: maxGb ? maxGb * 1024 : null,
      dedicatedSlot: cardStr.toLowerCase().includes("dedicated slot"),
    },
  };
};
