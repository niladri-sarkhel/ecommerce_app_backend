import mongoose from "mongoose";
import { Product } from "#models/product.model.js"; // Adjust import path

getGtinLookup = async (req, res) => {
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
};
