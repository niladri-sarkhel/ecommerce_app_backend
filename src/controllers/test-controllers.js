import { logger } from "#utils";

import { Product, Brand, Category } from "#models";
export const testController = {
  ping: (req, res) => {
    logger.info(
      { controller: "testController", func: "ping" },
      "this is a controller to test the server connection",
    );
    res.status(200).json({
      status: "success",
      message: "🏓 pong!",
      timestamp: new Date().toISOString(),
    });
  },

  echo: (req, res) => {
    logger.info(
      { controller: "testController", func: "echo" },
      "this is a controller to test the server connection",
    );
    res.status(200).json({
      status: "success",
      message: "Data received successfully",
      receivedBody: req.body,
      receivedHeaders: req.headers,
    });
  },

  asyncTest: async (req, res) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      logger.info(
        { controller: "testController", func: "asyncTest" },
        "this is a controller to test the server connection",
      );
      res.status(200).json({
        status: "success",
        message: "Async event loop and connections are working fine.",
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  },

  testDbCatalog: async (req, res, next) => {
    try {
      // 1. Get a quick count of everything to verify totals
      const totalProducts = await Product.countDocuments();
      const totalBrands = await Brand.countDocuments();
      const totalCategories = await Category.countDocuments();

      // 2. Fetch one product and populate its relational fields
      const sampleProduct = await Product.findOne()
        .populate("identity.brandId")
        .populate("catalog.categoryId");

      if (!sampleProduct) {
        return res.status(404).json({
          success: false,
          message: "No data found in products collection.",
        });
      }

      // 3. Return a clean report card
      return res.status(200).json({
        success: true,
        metrics: {
          totalProducts,
          totalBrands,
          totalCategories,
        },
        testSample: {
          model: sampleProduct.identity.model,
          slug: sampleProduct.identity.slug,
          sku: sampleProduct.identity.sku,
          gtin: sampleProduct.identity.gtin,
          resolvedBrand: sampleProduct.identity.brandId
            ? {
                id: sampleProduct.identity.brandId._id,
                name: sampleProduct.identity.brandId.name,
                slug: sampleProduct.identity.brandId.slug,
              }
            : "⚠️ NOT POPULATED",
          resolvedCategory: sampleProduct.catalog.categoryId
            ? {
                id: sampleProduct.catalog.categoryId._id,
                name: sampleProduct.catalog.categoryId.name,
                slug: sampleProduct.catalog.categoryId.slug,
              }
            : "⚠️ NOT POPULATED",
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
