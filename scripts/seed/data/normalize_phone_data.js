import fs from "fs";
import path from "path";
import { transformProduct } from "../transformers/product.transformer.js";

// Mock Maps for structural validation during the file compilation stage
// Since MongoDB IDs aren't real yet, we simulate them using deterministic placeholders
const mockBrandMap = new Proxy(
  {},
  {
    get: (target, name) =>
      `mock_brand_id_${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  },
);

const mockCategoryMap = {
  Smartphones: "mock_category_id_smartphones",
};

const generateStaticCatalog = () => {
  try {
    const rawDataPath = path.resolve("./scripts/seed/data/phone_data.json");
    const outputPath = path.resolve(
      "./scripts/seed/data/normalized_phone_data.json",
    );

    if (!fs.existsSync(rawDataPath)) {
      console.error(`❌ Error: Source file not found at ${rawDataPath}`);
      process.exit(1);
    }

    console.log("📖 Reading raw phone data...");
    const rawData = JSON.parse(fs.readFileSync(rawDataPath, "utf-8"));
    console.log(
      `Processing ${rawData.length} records. Structuring clean schemas...`,
    );

    const structuredProducts = [];
    let errorCount = 0;

    for (const item of rawData) {
      try {
        // Run data transformation across our micro-parsers
        const cleanProduct = transformProduct(
          item,
          mockBrandMap,
          mockCategoryMap,
        );
        structuredProducts.push(cleanProduct);
      } catch (err) {
        errorCount++;
        console.error(
          `⚠️ Failed to parse: ${item.brand} ${item.model}. Reason: ${err.message}`,
        );
      }
    }

    console.log(`💾 Writing clean structured output to: ${outputPath}`);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(structuredProducts, null, 2),
      "utf-8",
    );

    console.log("\n--- 📊 Transformation Summary ---");
    console.log(
      `✅ Successfully Processed : ${structuredProducts.length} items`,
    );
    console.log(`❌ Skipped due to errors   : ${errorCount} items`);
    console.log("---------------------------------");
  } catch (error) {
    console.error("💥 Critical pipeline crash:", error.message);
    process.exit(1);
  }
};

generateStaticCatalog();
