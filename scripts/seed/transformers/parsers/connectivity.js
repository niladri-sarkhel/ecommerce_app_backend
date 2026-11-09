import { cleanBoolean, safeSplitString } from "../../utils/parser.js";

/**
 * Transforms raw item communication features into the Mongoose connectivitySchema layout.
 * @param {Object} raw - Single raw phone payload from your dataset
 * @returns {Object} Structured data block conforming exactly to your schema design
 */
export const parseConnectivitySpec = (raw) => {
  const wlanStr = raw.WLAN || "";

  // 1. Defensively cast parameters to clean string fields to avoid runtime crashes
  const btStr = raw.bluetooth ? String(raw.bluetooth).trim() : "";
  const usbStr = raw.USB ? String(raw.USB).trim() : "";

  // 2. Parse Wi-Fi patterns (e.g., "Wi-Fi 802.11 a/b/g/n")
  const standardsMatch = wlanStr.match(
    /802\.11\s+([a\/b\/g\/n\/ac\/ax\/be]+)/i,
  );
  let standards = [];
  if (standardsMatch && standardsMatch[1]) {
    standards = standardsMatch[1]
      .split("/")
      .map((s) => `802.11 ${s.trim()}`)
      .filter(Boolean);
  }

  // 3. Isolate positioning arrays and ensure support flags stay unified
  const systemsList = raw.GPS
    ? safeSplitString(raw.GPS.replace(/yes\s+with/i, ""), " ")
    : [];

  return {
    wifi: {
      standards,
      wifiDirect: wlanStr.toLowerCase().includes("direct"),
      hotspot: wlanStr.toLowerCase().includes("hotspot"),
    },
    bluetooth: {
      version: btStr ? btStr.split("|")[0]?.trim() : null,
      profiles:
        btStr && btStr.includes("|")
          ? safeSplitString(btStr.split("|")[1] || "", ",")
          : [],
    },
    positioning: {
      // Intuitively flags true if explicit navigation arrays were discovered
      supported: systemsList.length > 0 || cleanBoolean(raw.GPS),
      systems: systemsList,
    },
    nfc: cleanBoolean(raw.NFC),
    infrared: false, // Default fallback if not tracked explicitly in this data dump
    usb: {
      connector: usbStr ? usbStr.split(" ")[0] : null,
      version: usbStr ? usbStr.split(" ")[1] || null : null,
      features: [],
    },
  };
};
