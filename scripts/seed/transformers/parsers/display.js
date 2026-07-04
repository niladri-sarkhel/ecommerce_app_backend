import { extractNumber } from "../../utils/parser.js";

export const parseDisplaySpec = (raw) => {
  const typeStr = raw.display_type || "";
  const resStr = raw.display_resolution || "";
  const sizeStr = raw.display_size || "";

  // Extract color depth from: "IPS LCD capacitive touchscreen  16M colors"
  const colorDepthMatch = typeStr.match(/(\d+M|\d+B)\s+colors/i);
  const colorDepth = colorDepthMatch ? colorDepthMatch[1] : null;

  // Extract tech type
  let technology = "LCD";
  if (/amoled/i.test(typeStr)) technology = "AMOLED";
  else if (/oled/i.test(typeStr)) technology = "OLED";
  else if (/ips/i.test(typeStr)) technology = "IPS LCD";

  // Extract dimension specifics out of cross-mapped keys
  const sizeInches = extractNumber(resStr, /^([\d.]+)\s*inches/i);
  const screenToBodyRatio = extractNumber(resStr, /~(\d.+)%\s*screen/i);

  const width = extractNumber(sizeStr, /^(\d+)\s*x/);
  const height = extractNumber(sizeStr, /x\s*(\d+)\s*pixels/);
  const pixelDensityPpi = extractNumber(sizeStr, /~(\d+)\s*ppi/);

  return {
    technology,
    touchscreen: typeStr.toLowerCase().includes("touchscreen"),
    colorDepth,
    sizeInches,
    screenToBodyRatio,
    resolution: { width, height },
    pixelDensityPpi,
  };
};
