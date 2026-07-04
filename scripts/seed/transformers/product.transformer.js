import { parseIdentity } from "./parsers/identity.js";
import { parseCatalog } from "./parsers/catalog.js";
import { parseBodySpec } from "./parsers/body.js";
import { parseDisplaySpec } from "./parsers/display.js";
import { parsePlatformSpec } from "./parsers/platform.js";
import { parseMemorySpec } from "./parsers/memory.js";
import { parseCameraSpec } from "./parsers/camera.js";
import { parseConnectivitySpec } from "./parsers/connectivity.js";
import { parseBatterySpec } from "./parsers/battery.js";
import { safeSplitString } from "../utils/parser.js";

export const transformProduct = (rawItem, brandMap, categoryMap) => {
  return {
    identity: parseIdentity(rawItem, brandMap),
    catalog: parseCatalog(rawItem, categoryMap),
    media: {
      images: rawItem.img_url
        ? [
            {
              type: "thumbnail",
              url: rawItem.img_url,
              alt: `${rawItem.brand} ${rawItem.model}`,
            },
          ]
        : [],
    },
    metadata: {
      source: "GSMArena Raw Data Dump",
      importedAt: new Date(),
      isActive: true,
      isDeleted: false,
    },
    specifications: {
      network: {
        technologies: safeSplitString(rawItem.network_technology, "/"),
        bands: [], // Expandable pattern if required later
        speeds: [],
      },
      body: parseBodySpec(rawItem),
      display: parseDisplaySpec(rawItem),
      platform: parsePlatformSpec(rawItem),
      memory: parseMemorySpec(rawItem),
      camera: parseCameraSpec(rawItem),
      audio: {
        loudSpeaker: rawItem.loud_speaker?.toLowerCase() === "yes",
        audioJack: rawItem.audio_jack?.toLowerCase() === "yes",
        radio: rawItem.radio,
      },
      connectivity: parseConnectivitySpec(rawItem),
      battery: parseBatterySpec(rawItem),
      sensors: safeSplitString(rawItem.sensors, "|").map((name) => ({ name })),
    },
  };
};
