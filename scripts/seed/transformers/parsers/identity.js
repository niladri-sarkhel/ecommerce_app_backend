import { slugify } from "../../utils/slugify.js";
import { generateDeterministicEan } from "../../utils/slugify.js";

/**
 * Transforms item manufacturer naming and unique identifiers into identitySchema format.
 * Ensures data-normalization is deterministic across successive pipeline transformations.
 */
export const parseIdentity = (raw, brandMap) => {
  const brandName = raw.brand || "Unknown";
  // Force numeric model IDs to clean strings safely
  const modelName =
    raw.model !== undefined && raw.model !== null
      ? String(raw.model).trim()
      : "";
  const brandId = brandMap[brandName] || null;

  const cleanSlug = slugify(`${brandName} ${modelName}`);

  // 1. Resolve GTIN/EAN gracefully using a fallback hash if missing
  const resolvedGtin =
    raw.ean && String(raw.ean).trim() !== ""
      ? String(raw.ean).trim()
      : generateDeterministicEan(cleanSlug);

  // 2. Format a highly accurate SKU code string: BRN-MDL-SUFFIX
  const brandCode = brandName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const modelCode = modelName
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const skuSuffix = resolvedGtin.substring(resolvedGtin.length - 5);

  const resolvedSku = `${brandCode}-${modelCode}-${skuSuffix}`;

  return {
    gtin: resolvedGtin,
    sku: resolvedSku,
    slug: cleanSlug,
    brandId,
    model: modelName,
  };
};
