import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import "../../src/config/env.js";

// Connect to your actual project configuration layouts
import { connectMongoDB, env } from "#config";
import { Brand, Category, Product } from "#models";

const seedDatabase = async () => {
  try {
    // 1. Establish database connection
    await connectMongoDB(env.MONGODB_URL);
    console.log(env.MONGODB_URL);
    console.log("🔌 Connected to MongoDB instance safely...");

    // 2. Clear old catalog data to prevent indexing conflicts
    console.log("🧹 Clearing existing collection data for clean seed...");
    await Product.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});

    // 3. Read your fully pre-validated normalized JSON file
    const targetFilePath = path.resolve(
      "./scripts/seed/data/normalized_phone_data.json",
    );
    if (!fs.existsSync(targetFilePath)) {
      throw new Error(
        `Normalized data file not found at: ${targetFilePath}. Run data:transform first.`,
      );
    }

    const preValidatedProducts = JSON.parse(
      fs.readFileSync(targetFilePath, "utf-8"),
    );
    console.log(
      `📖 Loaded ${preValidatedProducts.length} items from normalized cache store.`,
    );

    // 4. Seed unique Brands dynamically from the dataset
    console.log("🏭 Extracting unique brands for document reference...");
    const uniqueBrandNames = [
      ...new Set(
        preValidatedProducts.map((p) =>
          p.identity.model ? p.identity.slug.split("-")[0] : null,
        ),
      ),
    ].filter(Boolean);

    // We match the capitalization by checking original titles or mapping cleanly
    const brandMapRaw = [
      ...new Set(
        preValidatedProducts.map((p) => p.media.images[0]?.alt.split(" ")[0]),
      ),
    ].filter(Boolean);

    console.log(`✨ Seeding ${brandMapRaw.length} unique Brand collections...`);
    const insertedBrands = await Brand.insertMany(
      brandMapRaw.map((name) => ({ name, slug: name.toLowerCase() })),
    );

    // Create a lookup table linking the lowercase mock brand IDs to the real MongoDB ObjectIds
    const dbBrandMap = insertedBrands.reduce((acc, brand) => {
      acc[`mock_brand_id_${brand.slug.replace(/[^a-z0-9]/g, "")}`] = brand._id;
      return acc;
    }, {});

    // 5. Seed Category document collection
    console.log("📂 Seeding category trees...");
    const defaultCategory = await Category.create({
      name: "Smartphones",
      slug: "smartphones",
      description: "Mobile cellular devices and smartphones",
    });

    const mockCategoryKey = "mock_category_id_smartphones";
    const realCategoryId = defaultCategory._id;

    // 6. Map placeholders to true ObjectIds in a batch update arrays sweep
    console.log(
      "🔄 Resolving placeholder strings to true MongoDB ObjectIds...",
    );
    const finalProductPayloads = preValidatedProducts.map((product) => {
      const mockBrandKey = product.identity.brandId;

      return {
        ...product,
        identity: {
          ...product.identity,
          // Replace mock string reference with genuine MongoDB ObjectId
          brandId: dbBrandMap[mockBrandKey] || null,
        },
        catalog: {
          ...product.catalog,
          // Replace mock category string reference with genuine MongoDB ObjectId
          categoryId: realCategoryId,
        },
      };
    });

    // 7. Bulk insert using an optimized batch structure
    const batchSize = 1000;
    console.log(
      `🚀 Ingesting ${finalProductPayloads.length} products to database in chunks of ${batchSize}...`,
    );

    // for (let i = 0; i < finalProductPayloads.length; i += batchSize) {
    //   const chunk = finalProductPayloads.slice(i, i + batchSize);
    //   await Product.insertMany(chunk, { ordered: false });
    //   // await Product.insertMany(chunk, { ordered: true });
    //   console.log(
    //     `   📦 Committed chunk ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, finalProductPayloads.length)}/${finalProductPayloads.length})`,
    //   );
    // }

    for (let i = 0; i < finalProductPayloads.length; i += batchSize) {
      const chunk = finalProductPayloads.slice(i, i + batchSize);
      try {
        await Product.insertMany(chunk, { ordered: false });
        console.log(`    📦 Committed chunk ${Math.floor(i / batchSize) + 1}`);
      } catch (bulkError) {
        if (bulkError.writeErrors && bulkError.writeErrors.length > 0) {
          console.warn(
            `    ⚠️ Chunk ${Math.floor(i / batchSize) + 1} had ${bulkError.writeErrors.length} validation/duplicate failures.`,
          );

          const sampleError = bulkError.writeErrors[0];

          // Check if it's a structural schema validation error
          if (sampleError.err && sampleError.err.errors) {
            const firstFieldErr = Object.values(sampleError.err.errors)[0];
            console.error(
              `       Sample Error: [Index ${sampleError.index}] -> ${firstFieldErr.message}`,
            );
          }
          // Check if it's a unique index constraint duplicate error (Code 11000)
          else if (
            sampleError.code === 11000 ||
            (sampleError.err && sampleError.err.code === 11000)
          ) {
            const msg = sampleError.errmsg || sampleError.err.errmsg;
            console.error(
              `       Duplicate Key Error: [Index ${sampleError.index}] -> ${msg}`,
            );
          }
          // Fallback if it's a native driver string error
          else {
            console.error(
              `       Raw Error Detail: [Index ${sampleError.index}] -> ${sampleError.errmsg || JSON.stringify(sampleError)}`,
            );
          }
        } else {
          console.error(`    💥 Unexpected chunk failure:`, bulkError.message);
        }
      }
    }

    console.log(
      "\n🎉 Database collection successfully populated with professional data models!",
    );
    await mongoose.disconnect();
    console.log("🔌 Disconnected cleanly from MongoDB.");
  } catch (error) {
    console.error(
      "💥 Execution halted during pipeline ingestion phase:",
      error,
    );
    process.exit(1);
  }
};

seedDatabase();
