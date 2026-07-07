import dotenv from "dotenv";
import mongoose from "mongoose";

import { CatalogService } from "#services"; // Adjust path as needed

dotenv.config();

const env = {
  APP_NAME: process.env.APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_URL: process.env.APP_URL,
  MONGODB_URL:
    "mongodb://ecommerce_app_dbuser:ecommerce_app_dbuser_2708@localhost:27017/ecommerce_app",
  LOG_LEVEL: process.env.LOG_LEVEL,
};

console.log(env);

async function runTest() {
  try {
    // 1. Connect to your test/development database
    // Replace with your actual MongoDB connection string
    await mongoose.connect(env.MONGODB_URL);
    console.log("Connected to MongoDB successfully.\n");

    // 2. Define the search term you want to test (e.g., "zest", "tab", "acer")
    const testQuery = "samsung galaxy";
    console.log(`🔍 Searching for slugs matching: "${testQuery}"...`);

    // 3. Call the service function
    const result = await CatalogService.searchMasterCatalog({
      query: testQuery,
      page: 1,
      limit: 5,
    });

    // 4. Log out the results nicely
    console.log("\n--- SEARCH RESULTS ---");
    console.log(`Total Matches Found: ${result.pagination.totalItems}`);

    if (result.products.length === 0) {
      console.log("❌ No products matched that slug.");
    } else {
      result.products.forEach((product, index) => {
        console.log(
          `[${index + 1}] Slug: ${product.identity?.slug} | Model: ${product.identity?.model}`,
        );
      });
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    // Always close the connection when done
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

runTest();
