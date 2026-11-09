import { extractNumber } from "../../utils/parser.js";

export const parseBatterySpec = (raw) => {
  const batStr = raw.battery || "";
  const capacityMah = extractNumber(batStr, /(\d+)\s*mAh/);
  const energyWh = extractNumber(batStr, /\(([\d.]+)\s*Wh\)/);
  const removable = batStr.toLowerCase().startsWith("removable");

  let type = "Li-Ion";
  if (/li-po/i.test(batStr)) type = "Li-Po";

  return { type, capacityMah, energyWh, removable };
};
