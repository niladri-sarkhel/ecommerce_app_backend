import crypto from "node:crypto";

import { logger } from "#utils";
import { MailService } from "#services";

import { Product, Brand, Category } from "#models";

import { NOTIFICATION_TEMPLATES, MAIL_STRINGS } from "#config";

const templateKey = NOTIFICATION_TEMPLATES.EMAIL_VERIFICATION;

export const testController = {
  sendEmail: async (req, res, next) => {
    try {
      const otp = crypto.randomInt(100000, 1000000);

      await MailService.sendEmail(
        "niladri.sarkhel.dev@gmail.com",
        otp,
        MAIL_STRINGS[templateKey].SUBJECT,
        MAIL_STRINGS[templateKey].PURPOSE_TEXT,
      );

      return res.status(200).json({
        status: "success",
        message: "Email sent successfully.",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  },

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

  getGtinLookup: async (req, res) => {
    try {
      const { gtin } = req.params;

      if (!gtin) {
        return res
          .status(400)
          .json({ success: false, message: "GTIN barcode is required." });
      }

      const [result] = await Product.aggregate([
        // 1. Match the exact target product by GTIN & catalog status
        {
          $match: {
            "identity.gtin": gtin.trim(),
            "metadata.isActive": true,
            "metadata.isDeleted": false,
          },
        },

        // 2. Populate Brand information (equivalent to .populate('identity.brandId'))
        {
          $lookup: {
            from: "brands",
            localField: "identity.brandId",
            foreignField: "_id",
            as: "identity.brandId",
          },
        },
        {
          $unwind: {
            path: "$identity.brandId",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 3. Join active listings matching this Product ID
        {
          $lookup: {
            from: "listings",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$productId", "$$product_id"] },
                      { $eq: ["$status.state", "active"] },
                    ],
                  },
                },
              },
              // Join minimal Seller public details inside each listing
              {
                $lookup: {
                  from: "sellers",
                  localField: "sellerId",
                  foreignField: "_id",
                  as: "sellerId",
                  pipeline: [
                    {
                      $project: {
                        storeName: 1,
                        storeLogo: 1,
                        feedbackRating: 1,
                      },
                    },
                  ],
                },
              },
              {
                $unwind: {
                  path: "$sellerId",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "offers",
          },
        },

        // 4. Project clean, dynamic availability metrics alongside product & offers
        {
          $project: {
            product: "$$ROOT", // Preserves complete product document
            offers: 1,
            availability: {
              totalListingsCount: { $size: "$offers" },
              totalStockCount: { $sum: "$offers.inventory.quantity" },
              minPrice: {
                $cond: [
                  { $gt: [{ $size: "$offers" }, 0] },
                  { $min: "$offers.pricing.sellingPrice" },
                  null,
                ],
              },
              isAvailable: {
                $and: [
                  { $gt: [{ $size: "$offers" }, 0] },
                  { $gt: [{ $sum: "$offers.inventory.quantity" }, 0] },
                ],
              },
            },
          },
        },

        // 5. Cleanup duplicated root fields inside 'product'
        {
          $project: {
            "product.offers": 0,
            "product.availability": 0,
          },
        },
      ]);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: `Product with GTIN "${gtin}" was not found in the master catalog.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("GTIN lookup pipeline error in CatalogController:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error performing barcode lookup.",
      });
    }
  },
};
