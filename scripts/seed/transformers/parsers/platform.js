import { extractNumber } from "../../utils/parser.js";

export const parsePlatformSpec = (raw) => {
  const osStr = raw.OS || "";
  const cpuStr = raw.CPU || "";

  // Android 6.0 (Marshmallow)
  const osParts = osStr.split(" ");
  const osName = osParts[0] || null;
  const osVersion = osParts[1] || null;
  const codenameMatch = osStr.match(/\(([^)]+)\)/);
  const codename = codenameMatch ? codenameMatch[1] : null;

  const coreMap = { quad: 4, octa: 8, hexa: 6, dual: 2, single: 1 };
  const coreWord = cpuStr.split("-")[0]?.toLowerCase();
  const cores =
    coreMap[coreWord] || extractNumber(cpuStr, /(\d+)\s*core/i) || null;
  const clockSpeedGHz = extractNumber(cpuStr, /(\d.]+)\s*GHz/i);

  return {
    operatingSystem: { name: osName, version: osVersion, codename },
    chipset: {
      manufacturer: raw.Chipset ? raw.Chipset.split(" ")[0] : null,
      model: raw.Chipset,
    },
    cpu: {
      architecture: cpuStr.includes("Cortex") ? "ARM" : null,
      cores,
      clockSpeedGHz,
    },
    gpu: {
      manufacturer: raw.GPU ? raw.GPU.split("-")[0] : null,
      model: raw.GPU,
    },
  };
};
