import { safeSplitString, extractNumber } from "../../utils/parser.js";

export const parseBodySpec = (raw) => {
  const rawDim = raw.dimentions || "";
  const heightMm = extractNumber(rawDim, /^([\d.]+)\s*x/);
  const widthMm = extractNumber(rawDim, /x\s*([\d.]+)\s*x/);
  const thicknessMm = extractNumber(rawDim, /x\s*[\d.]+\s*x\s*([\d.]+)/);

  // Secure conversion to string representation to catch pure numeric SIM values
  const simStr =
    raw.SIM !== undefined && raw.SIM !== null ? String(raw.SIM).trim() : "";
  let simCount = 1;

  if (/dual/i.test(simStr)) simCount = 2;
  else if (/triple/i.test(simStr)) simCount = 3;
  else if (/quad/i.test(simStr)) simCount = 4;
  else if (simStr === "1" || simStr === "2") simCount = Number(simStr); // Handles raw numeric inputs

  const simTypesMatch = simStr.match(/\(([^)]+)\)/);
  const simTypes = simTypesMatch ? safeSplitString(simTypesMatch[1], "/") : [];

  return {
    dimensions: { heightMm, widthMm, thicknessMm },
    weight: {
      grams: raw.weight_g ? Number(raw.weight_g) : null,
      ounces: raw.weight_oz ? Number(raw.weight_oz) : null,
    },
    colors: safeSplitString(raw.colors, "|"),
    sim: { count: simCount, types: simTypes },
  };
};
