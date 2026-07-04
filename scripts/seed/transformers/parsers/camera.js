import { extractNumber, safeSplitString } from "../../utils/parser.js";

const parseCameraUnits = (camStr) => {
  if (!camStr || camStr.toLowerCase().includes("no")) return [];
  const parts = safeSplitString(camStr, "|");

  const resolutionMp = extractNumber(parts[0], /^([\d.]+)\s*MP/i);
  const autofocus = parts.some((p) => p.toLowerCase().includes("autofocus"));
  const ois = parts.some(
    (p) =>
      p.toLowerCase().includes("ois") ||
      p.toLowerCase().includes("stabilization"),
  );
  const aperture = extractNumber(camStr, /f\/([\d.]+)/);

  return [
    {
      type: "Standard",
      resolutionMp,
      aperture,
      autofocus,
      opticalImageStabilization: ois,
      focalLengthMm: null,
      features: parts.slice(1),
    },
  ];
};

export const parseCameraSpec = (raw) => {
  const secondaryParts = safeSplitString(raw.secondary_camera, "|");
  const frontVideos = secondaryParts.filter(
    (p) => p.toLowerCase().includes("p") || p.toLowerCase().includes("fps"),
  );

  return {
    rear: parseCameraUnits(raw.primary_camera),
    front: parseCameraUnits(raw.secondary_camera),
    rearVideo: [], // Add extraction rules if video is present explicitly in dataset
    frontVideo: frontVideos,
  };
};
